<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Cache-Control: public, max-age=900');
header('X-Content-Type-Options: nosniff');

$allowedProducts = ['1', '2', '4', '5', '6'];
$product = $_GET['product'] ?? '';
$day = $_GET['day'] ?? 'today';

function respondWithError($status, $message) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => $message]);
    exit;
}

if (!in_array($product, $allowedProducts, true)) {
    respondWithError(400, 'Unsupported FuelWatch product');
}

if ($day !== 'today') {
    respondWithError(400, 'Unsupported FuelWatch day');
}

$url = 'https://www.fuelwatch.wa.gov.au/fuelwatch/fuelWatchRSS?' . http_build_query([
    'Product' => $product,
    'Day' => $day,
]);

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 25,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; FueVolt/1.0; +https://www.fuevolt.com/contact)',
    CURLOPT_HTTPHEADER => ['Accept: application/rss+xml, application/xml, text/xml'],
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false || $httpCode !== 200) {
    respondWithError(502, $curlError ?: 'WA FuelWatch returned HTTP ' . $httpCode);
}

if (stripos($response, '<rss') === false || stripos($response, '<item>') === false) {
    respondWithError(502, 'WA FuelWatch returned an invalid feed');
}

header('Content-Type: ' . ($contentType ?: 'text/xml; charset=utf-8'));
echo $response;
