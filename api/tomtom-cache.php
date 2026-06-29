<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Cache-Control: public, max-age=3600');

$tomtomKey = 'ifJYQYlpFE1PVrOY9yhoXrjxN2UPN4Kd';
$base = 'https://api.tomtom.com';

$action = $_GET['action'] ?? '';

$cacheDir = __DIR__ . '/../cache/tomtom';
if (!is_dir($cacheDir)) {
    @mkdir($cacheDir, 0755, true);
}

$cacheFile = $cacheDir . '/' . md5($action . json_encode($_GET)) . '.json';
$cacheTTL = 86400; // 24 hours

if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTTL) {
    echo file_get_contents($cacheFile);
    exit;
}

$url = '';
switch ($action) {
    case 'search':
        $lat = $_GET['lat'] ?? '';
        $lon = $_GET['lon'] ?? '';
        $radius = $_GET['radius'] ?? '10000';
        $category = $_GET['category'] ?? '7311';
        $url = "$base/search/2/nearbySearch/.json?key=$tomtomKey&lat=$lat&lon=$lon&radius=$radius&categorySet=$category&limit=50&view=AU";
        break;

    case 'geocode':
        $q = urlencode($_GET['q'] ?? '');
        $url = "$base/search/2/geocode/$q.json?key=$tomtomKey&countrySet=AU&limit=1";
        break;

    case 'reverse':
        $lat = $_GET['lat'] ?? '';
        $lon = $_GET['lon'] ?? '';
        $url = "$base/search/2/reverseGeocode/$lat,$lon.json?key=$tomtomKey";
        break;

    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
        exit;
}

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_SSL_VERIFYPEER => true,
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code(502);
    echo json_encode(['error' => "TomTom API returned $httpCode"]);
    exit;
}

file_put_contents($cacheFile, $response);
echo $response;
