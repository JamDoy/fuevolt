-- FueVolt Corrections Database Schema
-- Run this in your Hostinger MySQL database (phpMyAdmin or CLI)
-- Database: fuevolt_db (already created on Hostinger)

CREATE TABLE IF NOT EXISTS corrections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    station_id VARCHAR(100) NOT NULL,
    station_name VARCHAR(255) DEFAULT '',
    field_name VARCHAR(100) NOT NULL,
    corrected_value TEXT NOT NULL,
    confirmed_count INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_correction (station_id, field_name, corrected_value(191)),
    INDEX idx_station (station_id),
    INDEX idx_confirmed (confirmed_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS correction_votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    correction_id INT NOT NULL,
    user_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_vote (correction_id, user_hash),
    FOREIGN KEY (correction_id) REFERENCES corrections(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create a database user for the application (update password!)
-- CREATE USER 'fuevolt_user'@'localhost' IDENTIFIED BY 'YOUR_SECURE_PASSWORD';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON fuevolt.* TO 'fuevolt_user'@'localhost';
-- FLUSH PRIVILEGES;
