<?php
/**
 * FueVolt Corrections API
 * 
 * Endpoints:
 * GET  /api/corrections.php?station_id=X  - Get corrections for a station
 * POST /api/corrections.php               - Submit a correction
 * 
 * Corrections require 3 independent confirmations before being applied.
 * Each user (identified by user_hash) can only submit one correction per field per station.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database configuration for Hostinger MySQL
$DB_HOST = 'localhost';
$DB_NAME = 'fuevolt_db';
$DB_USER = 'fuevolt_user';
$DB_PASS = 'Carlow87?';

function getDB() {
    global $DB_HOST, $DB_NAME, $DB_USER, $DB_PASS;
    try {
        $pdo = new PDO(
            "mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4",
            $DB_USER,
            $DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]
        );
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed. Please configure the database.']);
        exit;
    }
}

// Auto-create tables if they don't exist
function ensureTables($pdo) {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS corrections (
            id INT AUTO_INCREMENT PRIMARY KEY,
            station_id VARCHAR(100) NOT NULL,
            station_name VARCHAR(255) DEFAULT '',
            field_name VARCHAR(100) NOT NULL,
            corrected_value TEXT NOT NULL,
            confirmed_count INT DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_correction (station_id, field_name, corrected_value(191))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS correction_votes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            correction_id INT NOT NULL,
            user_hash VARCHAR(64) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_vote (correction_id, user_hash),
            FOREIGN KEY (correction_id) REFERENCES corrections(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
}

// --- GET: Fetch corrections for a station ---
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $station_id = $_GET['station_id'] ?? '';
    if (empty($station_id)) {
        http_response_code(400);
        echo json_encode(['error' => 'station_id is required']);
        exit;
    }

    $pdo = getDB();
    ensureTables($pdo);

    $stmt = $pdo->prepare("
        SELECT station_id, field_name, corrected_value, confirmed_count, updated_at
        FROM corrections
        WHERE station_id = ?
        ORDER BY confirmed_count DESC, updated_at DESC
    ");
    $stmt->execute([$station_id]);
    $corrections = $stmt->fetchAll();

    echo json_encode(['corrections' => $corrections]);
    exit;
}

// --- POST: Submit a correction ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $station_id = $input['station_id'] ?? '';
    $station_name = $input['station_name'] ?? '';
    $field_name = $input['field_name'] ?? '';
    $corrected_value = $input['corrected_value'] ?? '';
    $user_hash = $input['user_hash'] ?? '';

    if (empty($station_id) || empty($field_name) || empty($corrected_value) || empty($user_hash)) {
        http_response_code(400);
        echo json_encode(['error' => 'station_id, field_name, corrected_value, and user_hash are required']);
        exit;
    }

    $pdo = getDB();
    ensureTables($pdo);

    // Check if this exact correction already exists
    $stmt = $pdo->prepare("
        SELECT id, confirmed_count FROM corrections
        WHERE station_id = ? AND field_name = ? AND corrected_value = ?
    ");
    $stmt->execute([$station_id, $field_name, $corrected_value]);
    $existing = $stmt->fetch();

    if ($existing) {
        // Check if this user already voted on this correction
        $voteCheck = $pdo->prepare("
            SELECT id FROM correction_votes
            WHERE correction_id = ? AND user_hash = ?
        ");
        $voteCheck->execute([$existing['id'], $user_hash]);

        if ($voteCheck->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => 'You have already submitted this correction.']);
            exit;
        }

        // Add the vote
        $addVote = $pdo->prepare("INSERT INTO correction_votes (correction_id, user_hash) VALUES (?, ?)");
        $addVote->execute([$existing['id'], $user_hash]);

        // Increment confirmed count
        $update = $pdo->prepare("UPDATE corrections SET confirmed_count = confirmed_count + 1 WHERE id = ?");
        $update->execute([$existing['id']]);

        $newCount = $existing['confirmed_count'] + 1;

        echo json_encode([
            'success' => true,
            'message' => "Correction confirmed ({$newCount}/3).",
            'correction' => [
                'station_id' => $station_id,
                'field_name' => $field_name,
                'corrected_value' => $corrected_value,
                'confirmed_count' => $newCount,
            ],
        ]);
        exit;
    }

    // Check if user already submitted a different correction for this field at this station
    $userCheck = $pdo->prepare("
        SELECT c.id FROM corrections c
        JOIN correction_votes cv ON cv.correction_id = c.id
        WHERE c.station_id = ? AND c.field_name = ? AND cv.user_hash = ?
    ");
    $userCheck->execute([$station_id, $field_name, $user_hash]);

    if ($userCheck->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'You have already submitted a correction for this field at this station.']);
        exit;
    }

    // Create new correction
    $insert = $pdo->prepare("
        INSERT INTO corrections (station_id, station_name, field_name, corrected_value, confirmed_count)
        VALUES (?, ?, ?, ?, 1)
    ");
    $insert->execute([$station_id, $station_name, $field_name, $corrected_value]);
    $correctionId = $pdo->lastInsertId();

    // Record the vote
    $addVote = $pdo->prepare("INSERT INTO correction_votes (correction_id, user_hash) VALUES (?, ?)");
    $addVote->execute([$correctionId, $user_hash]);

    echo json_encode([
        'success' => true,
        'message' => 'Correction submitted (1/3 confirmations needed).',
        'correction' => [
            'station_id' => $station_id,
            'field_name' => $field_name,
            'corrected_value' => $corrected_value,
            'confirmed_count' => 1,
        ],
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
