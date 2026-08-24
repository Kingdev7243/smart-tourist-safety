-- =========================================================
-- SCHEMA MIGRATION v2 — Step 5 expansion
-- SAFE TO RUN AGAINST THE EXISTING, POPULATED `hackathon` DATABASE
--
-- This script is purely additive:
--   - ADD COLUMN IF NOT EXISTS on `users` (no drops, no data loss)
--   - CREATE TABLE IF NOT EXISTS for all 10 new tables
--
-- It does NOT touch admins, trips, zones, incidents, or alerts.
-- Existing rows in every table are left exactly as they are.
--
-- Run this once against your live database instead of re-running
-- schema.sql (which still drops the original six tables, unchanged
-- from the original design).
--
-- Requires MySQL 8.0.29+ for "ADD COLUMN IF NOT EXISTS" syntax,
-- which is satisfied by the project's MySQL 8.4+ requirement.
-- =========================================================

USE hackathon;


-- =========================================================
-- 1. USERS — add tourist authentication support
-- =========================================================

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL AFTER phone;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS last_login_at DATETIME NULL AFTER status;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP AFTER created_at;


-- =========================================================
-- 2. NEW TABLES
-- (identical definitions to the "SCHEMA EXPANSION" section of
-- schema.sql — see that file for column-by-column comments)
-- =========================================================

CREATE TABLE IF NOT EXISTS emergency_contacts (
    contact_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50) NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(150) NULL,
    priority INT NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_emergency_contacts_user (user_id)
);

CREATE TABLE IF NOT EXISTS location_history (
    location_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    trip_id BIGINT NULL,
    latitude DECIMAL(10, 6) NOT NULL,
    longitude DECIMAL(10, 6) NOT NULL,
    accuracy DECIMAL(10, 2) NULL,
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (trip_id) REFERENCES trips(trip_id) ON DELETE SET NULL,
    INDEX idx_location_history_user (user_id),
    INDEX idx_location_history_trip (trip_id),
    INDEX idx_location_history_recorded (recorded_at)
);

CREATE TABLE IF NOT EXISTS geofence_events (
    event_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    trip_id BIGINT NULL,
    zone_id BIGINT NULL,
    event_type VARCHAR(20) NOT NULL,
    latitude DECIMAL(10, 6) NOT NULL,
    longitude DECIMAL(10, 6) NOT NULL,
    occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    severity VARCHAR(20) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'UNHANDLED',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (trip_id) REFERENCES trips(trip_id) ON DELETE SET NULL,
    FOREIGN KEY (zone_id) REFERENCES zones(zone_id) ON DELETE SET NULL,
    INDEX idx_geofence_events_user (user_id),
    INDEX idx_geofence_events_trip (trip_id),
    INDEX idx_geofence_events_zone (zone_id),
    INDEX idx_geofence_events_occurred (occurred_at)
);

CREATE TABLE IF NOT EXISTS safety_checkins (
    checkin_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    trip_id BIGINT NOT NULL,
    latitude DECIMAL(10, 6) NULL,
    longitude DECIMAL(10, 6) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SAFE',
    note TEXT NULL,
    checked_in_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (trip_id) REFERENCES trips(trip_id) ON DELETE RESTRICT,
    INDEX idx_safety_checkins_user (user_id),
    INDEX idx_safety_checkins_trip (trip_id),
    INDEX idx_safety_checkins_checked_in (checked_in_at)
);

CREATE TABLE IF NOT EXISTS sos_events (
    sos_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    trip_id BIGINT NULL,
    incident_id BIGINT NULL,
    latitude DECIMAL(10, 6) NOT NULL,
    longitude DECIMAL(10, 6) NOT NULL,
    trigger_type VARCHAR(30) NOT NULL DEFAULT 'MANUAL_SOS',
    status VARCHAR(20) NOT NULL DEFAULT 'TRIGGERED',
    triggered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at DATETIME NULL,
    resolved_at DATETIME NULL,
    handled_by BIGINT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (trip_id) REFERENCES trips(trip_id) ON DELETE SET NULL,
    FOREIGN KEY (incident_id) REFERENCES incidents(incident_id) ON DELETE SET NULL,
    FOREIGN KEY (handled_by) REFERENCES admins(admin_id) ON DELETE SET NULL,
    INDEX idx_sos_events_user (user_id),
    INDEX idx_sos_events_trip (trip_id),
    INDEX idx_sos_events_incident (incident_id),
    INDEX idx_sos_events_status (status),
    INDEX idx_sos_events_triggered (triggered_at)
);

CREATE TABLE IF NOT EXISTS officer_profiles (
    admin_id BIGINT PRIMARY KEY,
    badge_number VARCHAR(50) NULL UNIQUE,
    phone VARCHAR(20) NULL,
    department VARCHAR(100) NULL,
    availability_status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    current_incident_id BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(admin_id) ON DELETE CASCADE,
    FOREIGN KEY (current_incident_id) REFERENCES incidents(incident_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS incident_assignments (
    assignment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    incident_id BIGINT NOT NULL,
    assigned_admin_id BIGINT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at DATETIME NULL,
    completed_at DATETIME NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ASSIGNED',
    notes TEXT NULL,
    FOREIGN KEY (incident_id) REFERENCES incidents(incident_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_admin_id) REFERENCES admins(admin_id) ON DELETE RESTRICT,
    INDEX idx_incident_assignments_incident (incident_id),
    INDEX idx_incident_assignments_admin (assigned_admin_id)
);

CREATE TABLE IF NOT EXISTS notifications (
    notification_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recipient_user_id BIGINT NULL,
    recipient_admin_id BIGINT NULL,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    related_incident_id BIGINT NULL,
    related_alert_id BIGINT NULL,
    related_zone_id BIGINT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME NULL,
    FOREIGN KEY (recipient_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_admin_id) REFERENCES admins(admin_id) ON DELETE CASCADE,
    FOREIGN KEY (related_incident_id) REFERENCES incidents(incident_id) ON DELETE SET NULL,
    FOREIGN KEY (related_alert_id) REFERENCES alerts(alert_id) ON DELETE SET NULL,
    FOREIGN KEY (related_zone_id) REFERENCES zones(zone_id) ON DELETE SET NULL,
    CONSTRAINT chk_notifications_single_recipient CHECK (
        (recipient_user_id IS NOT NULL AND recipient_admin_id IS NULL)
        OR
        (recipient_user_id IS NULL AND recipient_admin_id IS NOT NULL)
    ),
    INDEX idx_notifications_user (recipient_user_id),
    INDEX idx_notifications_admin (recipient_admin_id),
    INDEX idx_notifications_created (created_at)
);

CREATE TABLE IF NOT EXISTS incident_notes (
    note_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    incident_id BIGINT NOT NULL,
    created_by BIGINT NOT NULL,
    note_type VARCHAR(50) NOT NULL DEFAULT 'NOTE',
    description TEXT NULL,
    file_url VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (incident_id) REFERENCES incidents(incident_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES admins(admin_id) ON DELETE RESTRICT,
    INDEX idx_incident_notes_incident (incident_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    admin_id BIGINT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NULL,
    entity_id BIGINT NULL,
    description TEXT NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(admin_id) ON DELETE SET NULL,
    INDEX idx_audit_logs_admin (admin_id),
    INDEX idx_audit_logs_entity (entity_type, entity_id),
    INDEX idx_audit_logs_created (created_at)
);
