<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Cache-Control: public, max-age=3600');

$token = '3702baa0-61e3-4796-a011-45128c1e91fd';
$base  = 'https://fppdirectapi-prod.fuelpricesqld.com.au';

$endpoint = $_GET['endpoint'] ?? '';
$allowed  = ['GetFullSiteDetails', 'GetSitesPrices', 'GetCountryBrands', 'GetCountryFuelTypes'];

if ($endpoint === 'GetSitesPrices') {
    $path = '/Price/GetSitesPrices';
} elseif (in_array($endpoint, $allowed)) {
    $path = "/Subscriber/{$endpoint}";
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid endpoint']);
    exit;
}

$params = $_GET;
unset($params['endpoint']);
if (!isset($params['countryId'])) $params['countryId'] = '21';
$url = $base . $path . '?' . http_build_query($params);

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => ["Authorization: FPDAPI SubscriberToken={$token}"],
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_SSL_VERIFYPEER => true,
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code(502);
    echo json_encode(['error' => 'QLD API returned ' . $httpCode]);
    exit;
}

echo $response;
