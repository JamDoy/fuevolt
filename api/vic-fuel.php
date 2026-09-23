<?php
// Server-side proxy + cache for Victoria's Fair Fuel Open Data API. Added
// alongside the existing NSW/QLD/WA/NT proxies so every state's fuel data
// is fetched once server-side and shared across all visitors, rather than
// each visitor's own browser calling the government API directly.

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Cache-Control: public, max-age=3600');

require __DIR__ . '/fuel-cache.php';

const VIC_API_BASE = 'https://api.fuel.service.vic.gov.au/open-data/v1';
const VIC_CONSUMER_ID = '306d44cdce3e09a9a61135cbe7e5eff1';

function respondWithError($status, $message) {
    http_response_code($status);
    echo json_encode(['error' => $message]);
    exit;
}

// The endpoint returns every station and fuel type in the state in one
// response (the client filters by distance and fuel type itself) — one
// cached copy serves every visitor searching anywhere in Victoria.
$cacheDir = fuelCacheDir('vic');
$cacheKey = 'prices';
$cached = fuelCacheGet($cacheDir, $cacheKey);
if ($cached !== null) {
    echo $cached;
    exit;
}

$ch = curl_init(VIC_API_BASE . '/fuel/prices');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 20,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_HTTPHEADER => [
        'x-consumer-id: ' . VIC_CONSUMER_ID,
        'x-transactionid: ' . bin2hex(random_bytes(16)),
        'User-Agent: FueVolt/1.0',
    ],
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false || $httpCode !== 200) {
    // Fall back to a stale cache rather than failing outright if VIC's API
    // is temporarily down.
    $stale = fuelCacheStale($cacheDir, $cacheKey);
    if ($stale !== null) {
        echo $stale;
        exit;
    }
    respondWithError(502, $curlError ?: 'VIC API returned HTTP ' . $httpCode);
}

fuelCacheSet($cacheDir, $cacheKey, $response);
echo $response;
