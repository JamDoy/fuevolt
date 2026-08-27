<?php
// Server-side proxy for the MyFuel NT API. Keeps the NT account
// username/password out of the client bundle entirely — unlike the other
// state integrations (embedded client-side) or even the existing
// tomtom-cache.php (key hardcoded in a committed file), this credential is
// a real account password with a lockout risk, so it's read from a config
// file that's git-ignored and only ever written at deploy time from a
// GitHub Secret (see .github/workflows/deploy.yml).

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Cache-Control: public, max-age=300');

function respondWithError($status, $message) {
    http_response_code($status);
    echo json_encode(['error' => $message]);
    exit;
}

// Named nt-vars.php rather than nt-config.php for historical reasons only —
// the original name wasn't actually the problem. The real issue: the FTP
// deploy action's "Upload: new file" path for a path that's never existed
// on the server before appears unreliable on this host — it reports success
// but the file never lands, and its own state-tracking then believes the
// (nonexistent) file is already in sync, so it never retries. "File replace"
// for an already-existing path has been reliable every time, hence a
// placeholder version of this file now being manually seeded once via
// Hostinger's file manager, so future deploys always take the replace path.
$configFile = __DIR__ . '/nt-vars.php';
if (!file_exists($configFile)) {
    respondWithError(500, 'NT API not configured on this environment');
}
require $configFile;

if (!defined('NT_API_USERNAME') || !defined('NT_API_PASSWORD')) {
    respondWithError(500, 'NT API credentials missing');
}

$lat = filter_input(INPUT_GET, 'lat', FILTER_VALIDATE_FLOAT);
$lng = filter_input(INPUT_GET, 'lng', FILTER_VALIDATE_FLOAT);
$radius = filter_input(INPUT_GET, 'radius', FILTER_VALIDATE_FLOAT) ?: 10;
$fuelType = $_GET['fuelType'] ?? 'U91';

if ($lat === null || $lat === false || $lng === null || $lng === false) {
    respondWithError(400, 'lat and lng are required');
}

// Same fuel-type codes the client uses, mapped to MyFuel NT's own codes
// (confirmed live: U91, P95, P98, DL, LPG, E10 — same scheme NSW uses).
$fuelCodeMap = [
    'E10' => 'E10', 'U91' => 'U91', 'U95' => 'P95',
    'U98' => 'P98', 'Diesel' => 'DL', 'LPG' => 'LPG',
];
$ntCode = $fuelCodeMap[$fuelType] ?? 'U91';

const NT_API_BASE = 'https://myfuelnt.nt.gov.au/api';

function ntRequest($method, $path, $headers = [], $body = null) {
    $ch = curl_init(NT_API_BASE . $path);
    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_HTTPHEADER => $headers,
    ];
    if ($method === 'POST') {
        $opts[CURLOPT_POST] = true;
        $opts[CURLOPT_POSTFIELDS] = $body;
    }
    curl_setopt_array($ch, $opts);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($response === false || $httpCode < 200 || $httpCode >= 300) {
        return null;
    }
    return json_decode($response, true);
}

$cacheDir = __DIR__ . '/cache';
if (!is_dir($cacheDir)) {
    @mkdir($cacheDir, 0755, true);
}

// --- Step 1: bearer token (cached ~24h, matching the API's stated expiry) ---
function getNTToken($cacheDir) {
    $tokenFile = $cacheDir . '/nt-token.json';
    if (file_exists($tokenFile)) {
        $cached = json_decode(file_get_contents($tokenFile), true);
        if ($cached && time() < ($cached['expiresAt'] ?? 0)) {
            return $cached['token'];
        }
    }

    $body = http_build_query([
        'grant_type' => 'password',
        'username' => NT_API_USERNAME,
        'password' => NT_API_PASSWORD,
    ]);
    $data = ntRequest('POST', '/token', ['Content-Type: application/x-www-form-urlencoded'], $body);
    if (!$data || !isset($data['access_token'])) {
        return null;
    }

    $expiresIn = intval($data['expires_in'] ?? 3600);
    file_put_contents($tokenFile, json_encode([
        'token' => $data['access_token'],
        'expiresAt' => time() + $expiresIn - 60,
    ]));
    return $data['access_token'];
}

// --- Step 2: reference data — outlet catalogue + brand names (cached 24h) ---
function getNTReferenceData($cacheDir, $token) {
    $refFile = $cacheDir . '/nt-reference.json';
    if (file_exists($refFile) && (time() - filemtime($refFile)) < 86400) {
        return json_decode(file_get_contents($refFile), true);
    }

    $data = ntRequest('GET', '/v1/getReferenceData', [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json',
    ]);
    if (!$data || !isset($data['Outlets'])) {
        // Fall back to a stale cache rather than failing outright
        return file_exists($refFile) ? json_decode(file_get_contents($refFile), true) : null;
    }

    file_put_contents($refFile, json_encode($data));
    return $data;
}

function haversineKm($lat1, $lng1, $lat2, $lng2) {
    $R = 6371;
    $dLat = deg2rad($lat2 - $lat1);
    $dLng = deg2rad($lng2 - $lng1);
    $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
    return $R * 2 * atan2(sqrt($a), sqrt(1 - $a));
}

$token = getNTToken($cacheDir);
if (!$token) {
    respondWithError(502, 'Could not authenticate with MyFuel NT');
}

$reference = getNTReferenceData($cacheDir, $token);
if (!$reference || empty($reference['Outlets'])) {
    respondWithError(502, 'Could not load MyFuel NT reference data');
}

$brandMap = [];
foreach (($reference['Brands'] ?? []) as $b) {
    $brandMap[$b['BrandIdentifier']] = $b['BrandName'];
}

$nearbyOutlets = [];
foreach ($reference['Outlets'] as $o) {
    $dist = haversineKm($lat, $lng, $o['Latitude'], $o['Longitude']);
    if ($dist <= $radius) {
        $o['_dist'] = $dist;
        $nearbyOutlets[] = $o;
    }
}

if (empty($nearbyOutlets)) {
    echo json_encode([]);
    exit;
}

usort($nearbyOutlets, function ($a, $b) {
    return $a['_dist'] <=> $b['_dist'];
});

// --- Step 3: live prices, queried once per distinct postcode among nearby outlets ---
$postcodes = array_unique(array_column($nearbyOutlets, 'Postcode'));
$fuelsByOutletId = [];

foreach ($postcodes as $postcode) {
    $priceData = ntRequest('POST', '/v1/getFuelPrice/postCode', [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json',
    ], json_encode(['postCode' => $postcode]));

    if (!is_array($priceData)) continue;
    foreach ($priceData as $entry) {
        $fuelsByOutletId[$entry['FuelOutletIdentifier']] = $entry['AvailableFuel'] ?? [];
    }
}

$stations = [];
foreach ($nearbyOutlets as $o) {
    $fuels = $fuelsByOutletId[$o['FuelOutletIdentifier']] ?? [];
    $priceNum = null;
    foreach ($fuels as $f) {
        if ($f['FuelCode'] === $ntCode && ($f['IsAvailable'] ?? false)) {
            $p = floatval($f['Price']);
            if ($p > 0) $priceNum = $p;
        }
    }
    $suburb = trim($o['Suburb'] ?? '');

    $stations[] = [
        'id' => 'nt-' . $o['FuelOutletIdentifier'],
        'name' => $o['OutletName'] ?? 'Fuel Station',
        'brand' => $brandMap[$o['FuelBrandIdentifier']] ?? 'Independent',
        'address' => $o['Address'] . ', ' . $suburb . ' NT ' . $o['Postcode'],
        'latitude' => $o['Latitude'],
        'longitude' => $o['Longitude'],
        'price' => $priceNum !== null ? $priceNum / 100 : null,
        'priceDisplay' => $priceNum !== null ? number_format($priceNum, 1) . '¢/L' : 'N/A',
        'fuelType' => $ntCode,
        'lastUpdated' => null,
        'distance' => number_format($o['_dist'], 1),
        'source' => 'NT Government',
    ];
}

usort($stations, function ($a, $b) {
    return floatval($a['distance']) <=> floatval($b['distance']);
});
echo json_encode(array_slice($stations, 0, 30));
