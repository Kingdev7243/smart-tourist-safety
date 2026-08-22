-- =========================================================
-- SMART TOURIST SAFETY MONITORING SYSTEM
-- DEVELOPMENT / TEST DATA
-- MySQL 8.4+
-- =========================================================

USE hackathon;


-- =========================================================
-- ADMIN DATA
-- =========================================================

INSERT INTO admins
    (name, email, password_hash, role, status)
VALUES
    (
        'Kingston',
        'admin@safety.com',
        '$2a$12$DummyHashForPrototype1',
        'SUPER_ADMIN',
        'ACTIVE'
    ),
    (
        'Ravi',
        'ravi@safety.com',
        '$2a$12$DummyHashForPrototype2',
        'OPERATOR',
        'ACTIVE'
    );


-- =========================================================
-- USER DATA
-- =========================================================

INSERT INTO users
    (name, email, phone, status)
VALUES
    (
        'Arun Kumar',
        'arun@gmail.com',
        '9876543210',
        'ACTIVE'
    ),
    (
        'Rahul Das',
        'rahul@gmail.com',
        '9876543211',
        'ACTIVE'
    ),
    (
        'Priya Sharma',
        'priya@gmail.com',
        '9876543212',
        'ACTIVE'
    );


-- =========================================================
-- TRIP DATA
-- =========================================================

INSERT INTO trips
    (user_id, destination, start_time, end_time, status)
VALUES
    (
        1,
        'Ooty',
        '2026-08-18 09:00:00',
        '2026-08-20 18:00:00',
        'COMPLETED'
    ),
    (
        1,
        'Coorg',
        '2026-08-25 08:00:00',
        '2026-08-27 20:00:00',
        'PLANNED'
    ),
    (
        2,
        'Munnar',
        '2026-08-17 10:00:00',
        '2026-08-19 18:00:00',
        'COMPLETED'
    ),
    (
        3,
        'Kodaikanal',
        '2026-08-20 09:00:00',
        '2026-08-22 18:00:00',
        'ACTIVE'
    );


-- =========================================================
-- ZONE DATA
-- =========================================================

INSERT INTO zones
    (
        name,
        description,
        zone_type,
        latitude,
        longitude,
        radius,
        risk_level,
        status
    )
VALUES
    (
        'Ooty Lake',
        'Main tourist boating area',
        'SAFE',
        11.406400,
        76.693200,
        500.00,
        'LOW',
        'ACTIVE'
    ),
    (
        'Forest Zone',
        'Dense forest reserve, entry restricted after dark',
        'RESTRICTED',
        11.420000,
        76.700000,
        1000.00,
        'HIGH',
        'ACTIVE'
    ),
    (
        'Landslide Area',
        'Steep slope prone to rocks sliding during monsoon',
        'DANGER',
        11.430000,
        76.710000,
        750.00,
        'CRITICAL',
        'ACTIVE'
    );


-- =========================================================
-- INCIDENT DATA
-- =========================================================

INSERT INTO incidents
    (
        trip_id,
        zone_id,
        incident_type,
        description,
        latitude,
        longitude,
        severity,
        status,
        created_at
    )
VALUES
    (
        1,
        2,
        'GEOFENCE_VIOLATION',
        'Tourist entered the restricted forest zone without authorization.',
        11.420500,
        76.700200,
        'HIGH',
        'OPEN',
        '2026-08-19 19:00:00'
    ),
    (
        1,
        1,
        'SOS',
        'Tourist triggered emergency panic button near Ooty lake.',
        11.406200,
        76.693800,
        'CRITICAL',
        'INVESTIGATING',
        '2026-08-19 19:15:00'
    ),
    (
        3,
        NULL,
        'MEDICAL',
        'Tourist reported severe altitude sickness/fainting.',
        10.088900,
        77.059500,
        'HIGH',
        'RESOLVED',
        '2026-08-19 17:30:00'
    );


-- =========================================================
-- ALERT DATA
-- =========================================================

INSERT INTO alerts
    (
        incident_id,
        alert_type,
        message,
        priority,
        status,
        created_at
    )
VALUES
    (
        1,
        'GEOFENCE',
        'Arun Kumar crossed into Forest Zone (High Risk).',
        'HIGH',
        'ACKNOWLEDGED',
        '2026-08-19 19:02:00'
    ),
    (
        2,
        'SOS_PANIC',
        'EMERGENCY: Arun Kumar triggered SOS button!',
        'CRITICAL',
        'NEW',
        '2026-08-19 19:16:00'
    ),
    (
        3,
        'MEDICAL',
        'Medical assistance requested for Rahul Das.',
        'HIGH',
        'CLOSED',
        '2026-08-19 17:35:00'
    );


-- =========================================================
-- VERIFY SEEDED DATA
-- =========================================================

SELECT * FROM admins;

SELECT * FROM users;

SELECT * FROM trips;

SELECT * FROM zones;

SELECT * FROM incidents;

SELECT * FROM alerts;