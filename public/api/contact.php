<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = $_POST;
}

// Honeypot: bots fill hidden fields. If present, silently succeed.
if (!empty($data['company'])) {
    echo json_encode(['success' => true]);
    exit;
}

$name    = trim($data['name'] ?? '');
$email   = trim($data['email'] ?? '');
$message = trim($data['message'] ?? '');

if ($name === '' || $message === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Please provide your name and a message.']);
    exit;
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Please provide a valid email address.']);
    exit;
}
if (strlen($message) > 5000) {
    $message = substr($message, 0, 5000);
}

$to      = 'contact@fuevolt.com';
$subject = 'FueVolt feedback from ' . ($name !== '' ? $name : 'a visitor');

$body  = "You have received new feedback via fuevolt.com\n\n";
$body .= "Name: {$name}\n";
$body .= "Email: " . ($email !== '' ? $email : 'not provided') . "\n\n";
$body .= "Message:\n{$message}\n";

// Strip header-injection characters from anything used in headers.
$safeName = preg_replace('/[\r\n]+/', ' ', $name);
$fromAddr = 'noreply@fuevolt.com';
$headers  = "From: FueVolt Feedback <{$fromAddr}>\r\n";
if ($email !== '') {
    $safeEmail = preg_replace('/[\r\n]+/', '', $email);
    $headers .= "Reply-To: {$safeEmail}\r\n";
}
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$sent = @mail($to, $subject, $body, $headers);

if ($sent) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Could not send your message. Please try again later.']);
}
