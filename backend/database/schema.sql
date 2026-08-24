-- =========================================================
-- SMART TOURIST SAFETY MONITORING SYSTEM
-- DATABASE SCHEMA
-- MySQL 8.4+
-- =========================================================
--
-- IMPORTANT (unchanged from original):
-- Do not repeatedly run this file once real application data
-- exists. The DROP TABLE block below only covers the original
-- six tables, so re-running this file still wipes admins/users/
-- trips/zones/incidents/alerts data, exactly as before.
--
-- For applying the Step-5 schema expansion to the EXISTING,
-- already-populated `hackathon` database, use
-- database/schema_migration_v2.sql instead. That script is
-- additive only and does not drop or touch existing rows.
--
-- This file remains the canonical full schema for a fresh,
-- from-scratch database setup.
-- =========================================================

CREATE DATABASE IF NOT EXISTS hackathon;

USE hackathon;


-- =========================================================
-- DROP EXISTING TABLES (ORIGINAL SIX ONLY — UNCHANGED)
-- =========================================================

DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS incidents;
DROP TABLE IF EXISTS zones;
DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS admins;


-- =========================================================
-- ADMINS TABLE (unchanged)
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
-- Extended with tourist authentication support (Feature Group 1).
-- Existing columns are untouched; three columns added.
-- =========================================================

CREATE TABLE users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,

    -- NEW: tourist authentication support.
    -- Nullable because existing seeded users have no password yet;
    -- the login flow (a later step) is responsible for requiring it.
    password_hash VARCHAR(255) NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    -- NEW: last successful tourist login, for session/security visibility.
    last_login_at DATETIME NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- NEW: standard updated_at bookkeeping column.
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- =========================================================
-- TRIPS TABLE (unchanged)
--
-- Reviewed per Feature Group "Trip Support": the existing `status`
-- column already covers trip status / active-trip tracking (e.g.
-- 'ACTIVE', 'COMPLETED'), and start_time/end_time already exist.
-- No columns added — an "emergency state" flag would only
-- duplicate information already derivable from sos_events /
-- incidents linked to the trip, which is a better source of truth
-- than a denormalized flag that could drift out of sync.
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
-- ZONES TABLE (unchanged)
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
-- INCIDENTS TABLE (unchanged)
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
-- ALERTS TABLE (unchanged)
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


-- =========================================================================
-- =========================================================================
-- SCHEMA EXPANSION (Step 5 — final pre-hackathon schema)
--
-- All tables below are NEW. They use CREATE TABLE IF NOT EXISTS
-- deliberately (not DROP + CREATE) so that this section is safe to
-- re-run without destroying data, even though the block above is not.
-- =========================================================================
-- =========================================================================


-- =========================================================
-- EMERGENCY_CONTACTS (Feature Group 2)
-- A tourist's trusted contacts. Deleting the tourist deletes their
-- contacts too (CASCADE) rather than leaving orphaned rows — these
-- are personal contact records, not safety history.
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

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    INDEX idx_emergency_contacts_user (user_id)
);


-- =========================================================
-- LOCATION_HISTORY (Feature Group 3)
-- Frequent GPS pings. user_id uses RESTRICT (not CASCADE) because
-- this is safety history that should not silently vanish; trip_id
-- is nullable/SET NULL since a location ping can outlive its trip.
-- =========================================================

CREATE TABLE IF NOT EXISTS location_history (
    location_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT NOT NULL,
    trip_id BIGINT NULL,

    latitude DECIMAL(10, 6) NOT NULL,
    longitude DECIMAL(10, 6) NOT NULL,
    accuracy DECIMAL(10, 2) NULL,

    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE RESTRICT,

    FOREIGN KEY (trip_id)
        REFERENCES trips(trip_id)
        ON DELETE SET NULL,

    INDEX idx_location_history_user (user_id),
    INDEX idx_location_history_trip (trip_id),
    INDEX idx_location_history_recorded (recorded_at)
);


-- =========================================================
-- GEOFENCE_EVENTS (Feature Group 4)
-- Records zone entry/exit/dwell/violation events. zone_id uses
-- SET NULL (mirrors incidents.zone_id) so a deleted zone never
-- deletes the historical event, only detaches it.
-- =========================================================

CREATE TABLE IF NOT EXISTS geofence_events (
    event_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT NOT NULL,
    trip_id BIGINT NULL,
    zone_id BIGINT NULL,

    event_type VARCHAR(20) NOT NULL,   -- ENTERED / EXITED / DWELLING / VIOLATION

    latitude DECIMAL(10, 6) NOT NULL,
    longitude DECIMAL(10, 6) NOT NULL,

    occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    severity VARCHAR(20) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'UNHANDLED',  -- UNHANDLED / ACKNOWLEDGED

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE RESTRICT,

    FOREIGN KEY (trip_id)
        REFERENCES trips(trip_id)
        ON DELETE SET NULL,

    FOREIGN KEY (zone_id)
        REFERENCES zones(zone_id)
        ON DELETE SET NULL,

    INDEX idx_geofence_events_user (user_id),
    INDEX idx_geofence_events_trip (trip_id),
    INDEX idx_geofence_events_zone (zone_id),
    INDEX idx_geofence_events_occurred (occurred_at)
);


-- =========================================================
-- SAFETY_CHECKINS (Feature Group 5)
-- A check-in is tied to a specific trip by design (RESTRICT, not
-- nullable) — a check-in without trip context isn't meaningful here.
-- =========================================================

CREATE TABLE IF NOT EXISTS safety_checkins (
    checkin_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT NOT NULL,
    trip_id BIGINT NOT NULL,

    latitude DECIMAL(10, 6) NULL,
    longitude DECIMAL(10, 6) NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'SAFE',  -- SAFE / NEED_ASSISTANCE / MISSED
    note TEXT NULL,

    checked_in_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE RESTRICT,

    FOREIGN KEY (trip_id)
        REFERENCES trips(trip_id)
        ON DELETE RESTRICT,

    INDEX idx_safety_checkins_user (user_id),
    INDEX idx_safety_checkins_trip (trip_id),
    INDEX idx_safety_checkins_checked_in (checked_in_at)
);


-- =========================================================
-- SOS_EVENTS (Feature Group 6)
-- Dedicated emergency trigger table, separate from `incidents`.
-- incident_id is nullable: an SOS can exist before an incident is
-- created from it (or in rare cases without one).
-- =========================================================

CREATE TABLE IF NOT EXISTS sos_events (
    sos_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT NOT NULL,
    trip_id BIGINT NULL,
    incident_id BIGINT NULL,

    latitude DECIMAL(10, 6) NOT NULL,
    longitude DECIMAL(10, 6) NOT NULL,

    trigger_type VARCHAR(30) NOT NULL DEFAULT 'MANUAL_SOS',
    -- MANUAL_SOS / GEOFENCE / FALL / MISSED_CHECKIN / SYSTEM

    status VARCHAR(20) NOT NULL DEFAULT 'TRIGGERED',
    -- TRIGGERED / ACKNOWLEDGED / RESOLVED / FALSE_ALARM

    triggered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at DATETIME NULL,
    resolved_at DATETIME NULL,

    handled_by BIGINT NULL,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE RESTRICT,

    FOREIGN KEY (trip_id)
        REFERENCES trips(trip_id)
        ON DELETE SET NULL,

    FOREIGN KEY (incident_id)
        REFERENCES incidents(incident_id)
        ON DELETE SET NULL,

    FOREIGN KEY (handled_by)
        REFERENCES admins(admin_id)
        ON DELETE SET NULL,

    INDEX idx_sos_events_user (user_id),
    INDEX idx_sos_events_trip (trip_id),
    INDEX idx_sos_events_incident (incident_id),
    INDEX idx_sos_events_status (status),
    INDEX idx_sos_events_triggered (triggered_at)
);


-- =========================================================
-- OFFICER_PROFILES (Feature Group 7)
-- Deliberately NOT a separate authentication system. This is a 1:1
-- extension of `admins` — admin_id is both the primary key and the
-- foreign key, so an officer is just an admin (typically role
-- INSPECTOR, sometimes OPERATOR) with extra profile fields.
-- current_incident_id is a denormalized convenience pointer for
-- quick "who's currently on what" lookups; incident_assignments
-- remains the source of truth for assignment history.
-- =========================================================

CREATE TABLE IF NOT EXISTS officer_profiles (
    admin_id BIGINT PRIMARY KEY,

    badge_number VARCHAR(50) NULL UNIQUE,
    phone VARCHAR(20) NULL,
    department VARCHAR(100) NULL,

    availability_status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    -- AVAILABLE / ON_DUTY / OFF_DUTY / UNAVAILABLE

    current_incident_id BIGINT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (admin_id)
        REFERENCES admins(admin_id)
        ON DELETE CASCADE,

    FOREIGN KEY (current_incident_id)
        REFERENCES incidents(incident_id)
        ON DELETE SET NULL
);


-- =========================================================
-- INCIDENT_ASSIGNMENTS (Feature Group 8)
-- Assigns an incident to an admin/officer. CASCADE on incident_id
-- (an assignment cannot outlive its incident); RESTRICT on the
-- assigned admin so the assignment history/audit trail can't be
-- silently lost by deleting an admin account.
-- =========================================================

CREATE TABLE IF NOT EXISTS incident_assignments (
    assignment_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    incident_id BIGINT NOT NULL,
    assigned_admin_id BIGINT NOT NULL,

    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at DATETIME NULL,
    completed_at DATETIME NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'ASSIGNED',
    -- ASSIGNED / ACCEPTED / IN_PROGRESS / COMPLETED / CANCELLED

    notes TEXT NULL,

    FOREIGN KEY (incident_id)
        REFERENCES incidents(incident_id)
        ON DELETE CASCADE,

    FOREIGN KEY (assigned_admin_id)
        REFERENCES admins(admin_id)
        ON DELETE RESTRICT,

    INDEX idx_incident_assignments_incident (incident_id),
    INDEX idx_incident_assignments_admin (assigned_admin_id)
);


-- =========================================================
-- NOTIFICATIONS (Feature Group 9)
-- Persistence layer only — no delivery service implemented here.
-- Recipient is polymorphic (a user OR an admin); the CHECK
-- constraint enforces exactly one is set. MySQL 8.4 enforces CHECK
-- constraints, so this is a real guarantee, not just a comment.
-- =========================================================

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

    FOREIGN KEY (recipient_user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    FOREIGN KEY (recipient_admin_id)
        REFERENCES admins(admin_id)
        ON DELETE CASCADE,

    FOREIGN KEY (related_incident_id)
        REFERENCES incidents(incident_id)
        ON DELETE SET NULL,

    FOREIGN KEY (related_alert_id)
        REFERENCES alerts(alert_id)
        ON DELETE SET NULL,

    FOREIGN KEY (related_zone_id)
        REFERENCES zones(zone_id)
        ON DELETE SET NULL,

    CONSTRAINT chk_notifications_single_recipient CHECK (
        (recipient_user_id IS NOT NULL AND recipient_admin_id IS NULL)
        OR
        (recipient_user_id IS NULL AND recipient_admin_id IS NOT NULL)
    ),

    INDEX idx_notifications_user (recipient_user_id),
    INDEX idx_notifications_admin (recipient_admin_id),
    INDEX idx_notifications_created (created_at)
);


-- =========================================================
-- INCIDENT_NOTES (Feature Group 10)
-- Lightweight notes/evidence metadata. No binary data in MySQL —
-- file_url is a nullable pointer to wherever the file actually
-- lives (future object storage), so the schema doesn't need to
-- change when uploads are implemented later.
-- =========================================================

CREATE TABLE IF NOT EXISTS incident_notes (
    note_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    incident_id BIGINT NOT NULL,
    created_by BIGINT NOT NULL,

    note_type VARCHAR(50) NOT NULL DEFAULT 'NOTE',  -- NOTE / PHOTO / DOCUMENT
    description TEXT NULL,
    file_url VARCHAR(500) NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (incident_id)
        REFERENCES incidents(incident_id)
        ON DELETE CASCADE,

    FOREIGN KEY (created_by)
        REFERENCES admins(admin_id)
        ON DELETE RESTRICT,

    INDEX idx_incident_notes_incident (incident_id)
);


-- =========================================================
-- AUDIT_LOGS (Feature Group 11)
-- admin_id is nullable because some actions (e.g. a tourist
-- triggering an SOS) have no admin actor. SET NULL preserves the
-- log row even if the acting admin's account is later removed —
-- audit history must never disappear.
-- =========================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    admin_id BIGINT NULL,

    action VARCHAR(100) NOT NULL,
    -- e.g. ADMIN_LOGIN, INCIDENT_CREATED, INCIDENT_ASSIGNED,
    -- INCIDENT_RESOLVED, ALERT_ACKNOWLEDGED, ZONE_CREATED,
    -- ZONE_UPDATED, SOS_ACKNOWLEDGED, USER_STATUS_CHANGED

    entity_type VARCHAR(50) NULL,
    entity_id BIGINT NULL,

    description TEXT NULL,
    ip_address VARCHAR(45) NULL,  -- fits IPv6

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (admin_id)
        REFERENCES admins(admin_id)
        ON DELETE SET NULL,

    INDEX idx_audit_logs_admin (admin_id),
    INDEX idx_audit_logs_entity (entity_type, entity_id),
    INDEX idx_audit_logs_created (created_at)
);
