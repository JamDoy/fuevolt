<?php
// Server-side proxy + cache for Open Charge Map — mirrors the fuel-price
// proxies (nsw-fuel.php etc.) so an EV charger search is shared across every
// visitor searching the same area, instead of each visitor's own browser
// calling Open Charge Map directly on every search (see the old
// fetchEVStations in src/utils/api.js, which did exactly that uncached).

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Cache-Control: public, max-age=3600');

require __DIR__ . '/fuel-cache.php';

// Charger locations change far less often than fuel prices, so this can
// safely cache much longer than the 1-hour default the fuel proxies use.
const EV_CACHE_TTL = 6 * 3600; // 6 hours

const OCM_API_KEY = '1ce3a80b-61c0-40e2-97ed-45e81462eac9';
const OCM_BASE_URL = 'https://api.openchargemap.io/v3/poi/';

$lat = filter_input(INPUT_GET, 'lat', FILTER_VALIDATE_FLOAT);
$lng = filter_input(INPUT_GET, 'lng', FILTER_VALIDATE_FLOAT);
$distance = filter_input(INPUT_GET, 'distance', FILTER_VALIDATE_FLOAT) ?: 10;
$maxresults = filter_input(INPUT_GET, 'maxresults', FILTER_VALIDATE_INT) ?: 100;

if ($lat === null || $lat === false || $lng === null || $lng === false) {
    http_response_code(400);
    echo json_encode(['error' => 'lat and lng are required']);
    exit;
}

// Same ~11km grid the fuel proxies use, so nearby searches share one cached
// response instead of each getting their own.
$gridLat = round($lat * 10) / 10;
$gridLng = round($lng * 10) / 10;

$cacheDir = fuelCacheDir('ev');
$cacheKey = $gridLat . '-' . $gridLng . '-' . $distance . '-' . $maxresults;
$cached = fuelCacheGet($cacheDir, $cacheKey, EV_CACHE_TTL);
if ($cached !== null) {
    echo $cached;
    exit;
}

$params = http_build_query([
    'output' => 'json',
    'countrycode' => 'AU',
    'key' => OCM_API_KEY,
    'latitude' => $lat,
    'longitude' => $lng,
    'distance' => $distance,
    'distanceunit' => 'KM',
    'maxresults' => $maxresults,
    'compact' => 'false',
    'verbose' => 'true',
]);

$ch = curl_init(OCM_BASE_URL . '?' . $params);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 20,
    CURLOPT_SSL_VERIFYPEER => true,
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false || $httpCode !== 200) {
    // Fall back to a stale cache rather than failing outright if Open Charge
    // Map is temporarily down.
    $stale = fuelCacheStale($cacheDir, $cacheKey);
    if ($stale !== null) {
        echo $stale;
        exit;
    }
    http_response_code(502);
    echo json_encode(['error' => $curlError ?: 'Open Charge Map returned HTTP ' . $httpCode]);
    exit;
}

fuelCacheSet($cacheDir, $cacheKey, $response);
echo $response;
