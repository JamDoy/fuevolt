<?php
// Server-side proxy + cache for the NSW FuelCheck API (also covers ACT and
// TAS, which report through this same API — see the matching comment in
// src/utils/api.js). Added alongside the existing QLD/WA/NT proxies so
// every state's fuel data is fetched once server-side and shared across all
// visitors, rather than each visitor's own browser calling the government
// API — and its OAuth token directly — themselves on every search.

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Cache-Control: public, max-age=3600');

require __DIR__ . '/fuel-cache.php';

const NSW_API_BASE = 'https://api.onegov.nsw.gov.au';
const NSW_API_KEY = 'X7DpwSdP5B4ZImMCielDuQnfAV9GqsiV';
const NSW_API_SECRET = 'ZiqBdeXrUjMkRuiR';

function respondWithError($status, $message) {
    http_response_code($status);
    echo json_encode(['error' => $message]);
    exit;
}

$lat = filter_input(INPUT_GET, 'lat', FILTER_VALIDATE_FLOAT);
$lng = filter_input(INPUT_GET, 'lng', FILTER_VALIDATE_FLOAT);
$radius = filter_input(INPUT_GET, 'radius', FILTER_VALIDATE_FLOAT) ?: 10;
$fuelType = $_GET['fuelType'] ?? 'E10';

if ($lat === null || $lat === false || $lng === null || $lng === false) {
    respondWithError(400, 'lat and lng are required');
}

// Same ~11km grid the old client-side localStorage cache used, so nearby
// searches share a cache entry instead of each getting their own.
$gridLat = round($lat * 10) / 10;
$gridLng = round($lng * 10) / 10;

$cacheDir = fuelCacheDir('nsw');
$cacheKey = $fuelType . '-' . $gridLat . '-' . $gridLng . '-' . $radius;
$cached = fuelCacheGet($cacheDir, $cacheKey);
if ($cached !== null) {
    echo $cached;
    exit;
}

// --- Bearer token, cached until shortly before it expires ---
function getNSWToken($cacheDir) {
    $tokenFile = $cacheDir . '/nsw-token.json';
    if (file_exists($tokenFile)) {
        $cachedToken = json_decode(file_get_contents($tokenFile), true);
        if ($cachedToken && time() < ($cachedToken['expiresAt'] ?? 0)) {
            return $cachedToken['token'];
        }
    }

    $ch = curl_init(NSW_API_BASE . '/oauth/client_credential/accesstoken?grant_type=client_credentials');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_HTTPHEADER => ['Authorization: Basic ' . base64_encode(NSW_API_KEY . ':' . NSW_API_SECRET)],
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false || $httpCode !== 200 || !$response) {
        return null;
    }
    $data = json_decode($response, true);
    if (!isset($data['access_token'])) {
        return null;
    }

    // NSW's own stated expiry when present, otherwise a conservative
    // default well inside the typical 1-hour OAuth token lifetime.
    $expiresIn = isset($data['expires_in']) ? intval($data['expires_in']) : 3000;
    file_put_contents($tokenFile, json_encode([
        'token' => $data['access_token'],
        'expiresAt' => time() + $expiresIn - 60,
    ]));
    return $data['access_token'];
}

$tokenCacheDir = fuelCacheDir('nsw');
$token = getNSWToken($tokenCacheDir);
if (!$token) {
    $stale = fuelCacheStale($cacheDir, $cacheKey);
    if ($stale !== null) {
        echo $stale;
        exit;
    }
    respondWithError(502, 'Could not authenticate with NSW FuelCheck');
}

$body = json_encode([
    'fueltype' => $fuelType,
    'latitude' => (string) $lat,
    'longitude' => (string) $lng,
    'radius' => (string) $radius,
    'sortby' => 'price',
    'sortascending' => 'true',
]);

$ch = curl_init(NSW_API_BASE . '/FuelPriceCheck/v2/fuel/prices/nearby');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 20,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $body,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json',
        'apikey: ' . NSW_API_KEY,
        // Required by this endpoint — same requirement the old client-side
        // call had ("Missing header values: transactionID, requestTimeStamp").
        'transactionID: ' . bin2hex(random_bytes(16)),
        'requestTimeStamp: ' . gmdate('Y-m-d\TH:i:s\Z'),
    ],
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false || $httpCode !== 200) {
    // Fall back to a stale cache rather than failing outright if NSW's API
    // is temporarily down.
    $stale = fuelCacheStale($cacheDir, $cacheKey);
    if ($stale !== null) {
        echo $stale;
        exit;
    }
    respondWithError(502, $curlError ?: 'NSW API returned HTTP ' . $httpCode);
}

fuelCacheSet($cacheDir, $cacheKey, $response);
echo $response;
