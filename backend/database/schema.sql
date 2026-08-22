-- =========================================================
-- SMART TOURIST SAFETY MONITORING SYSTEM
-- DATABASE SCHEMA
-- MySQL 8.4+
-- =========================================================

CREATE DATABASE IF NOT EXISTS hackathon;

USE hackathon;


-- =========================================================
-- DROP EXISTING TABLES
-- =========================================================

DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS incidents;
DROP TABLE IF EXISTS zones;
DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS admins;


-- =========================================================
-- ADMINS TABLE
-- =========================================================

CREATE TABLE admins (
    admin_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- USERS TABLE
-- =========================================================

CREATE TABLE users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- TRIPS TABLE
-- =========================================================

CREATE TABLE trips (
    trip_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT NOT NULL,

    destination VARCHAR(150) NOT NULL,

    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE RESTRICT
);


-- =========================================================
-- ZONES TABLE
-- =========================================================

CREATE TABLE zones (
    zone_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(150) NOT NULL,
    description TEXT,

    zone_type VARCHAR(50) NOT NULL,

    latitude DECIMAL(10, 6) NOT NULL,
    longitude DECIMAL(10, 6) NOT NULL,

    radius DECIMAL(10, 2) NOT NULL,

    risk_level VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- INCIDENTS TABLE
-- =========================================================

CREATE TABLE incidents (
    incident_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    trip_id BIGINT NOT NULL,
    zone_id BIGINT NULL,

    incident_type VARCHAR(100) NOT NULL,
    description TEXT,

    latitude DECIMAL(10, 6) NOT NULL,
    longitude DECIMAL(10, 6) NOT NULL,

    severity VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME NULL,

    resolved_by BIGINT NULL,

    FOREIGN KEY (trip_id)
        REFERENCES trips(trip_id)
        ON DELETE RESTRICT,

    FOREIGN KEY (zone_id)
        REFERENCES zones(zone_id)
        ON DELETE SET NULL,

    FOREIGN KEY (resolved_by)
        REFERENCES admins(admin_id)
        ON DELETE SET NULL
);


-- =========================================================
-- ALERTS TABLE
-- =========================================================

CREATE TABLE alerts (
    alert_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    incident_id BIGINT,

    alert_type VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,

    priority VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'NEW',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    acknowledged_at DATETIME NULL,
    acknowledged_by BIGINT NULL,

    closed_at DATETIME NULL,

    FOREIGN KEY (incident_id)
        REFERENCES incidents(incident_id)
        ON DELETE RESTRICT,

    FOREIGN KEY (acknowledged_by)
        REFERENCES admins(admin_id)
        ON DELETE SET NULL
);