# Smart Tourist Safety Monitoring System

## Agent Context / Project Specification

## 1. Project Overview

This project is a Smart Tourist Safety Monitoring & Incident Response System.

The goal is to provide tourists with a safety-focused mobile application and authorities with a separate administrative application.

The system will support:

* Tourist registration and authentication
* Trip management
* GPS tracking
* Geofencing
* Real-time zone breach detection
* SOS/emergency reporting
* E-FIR filing
* Incident management
* Admin/operator/inspector workflows
* Real-time notifications
* SMS acknowledgement
* Offline-first client behavior
* Analytics
* AI/ML-based anomaly detection

The current goal is the internal hackathon/SIH prototype. The software should demonstrate a convincing end-to-end workflow. Hardware and advanced AI can be developed further after the prototype is shortlisted.

---

# 2. Overall Architecture

There are THREE major components:

```text
                 ┌──────────────────────┐
                 │     CLIENT APP       │
                 │    Tourist-facing    │
                 └──────────┬───────────┘
                            │
                            │ REST API / WebSocket
                            ▼
                 ┌──────────────────────┐
                 │       FASTAPI        │
                 │       BACKEND        │
                 └──────────┬───────────┘
                            │
                       SQLAlchemy
                            │
                            ▼
                 ┌──────────────────────┐
                 │        MYSQL         │
                 │   hackathon database │
                 └──────────────────────┘
                            ▲
                       SQLAlchemy
                            │
                 ┌──────────┴───────────┐
                 │     ADMIN APP        │
                 │ Admin/Operator/      │
                 │ Inspector dashboard  │
                 └──────────────────────┘
```

IMPORTANT:

* Client App and Admin App are SEPARATE applications.
* Neither frontend connects directly to MySQL.
* Both applications communicate with FastAPI.
* FastAPI communicates with MySQL through SQLAlchemy.
* Existing MySQL schema should NOT be unnecessarily redesigned.
* Do not create duplicate databases.
* Do not make the frontends directly query MySQL.

---

# 3. Current Technology Stack

## Database

MySQL 8.4+

Database name:

```text
hackathon
```

## Backend

Python

FastAPI

SQLAlchemy

PyMySQL

Pydantic

python-dotenv

Uvicorn

## Frontends

There are two separate frontend applications:

1. Client/Tourist App
2. Admin App

The exact frontend technology can be decided separately by the frontend team, but both must communicate with FastAPI through APIs.

---

# 4. Current Backend Structure

The backend currently looks approximately like:

```text
backend/
│
├── app/
│   ├── __init__.py
│   ├── main.py
│   └── database.py
│
├── .env
│
└── database/
    ├── schema.sql
    └── seed.sql
```

This structure can be expanded as the backend is developed.

A likely future structure is:

```text
backend/
│
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   │
│   ├── schemas/
│   │   ├── user.py
│   │   ├── trip.py
│   │   ├── incident.py
│   │   ├── alert.py
│   │   ├── zone.py
│   │   └── auth.py
│   │
│   ├── routers/
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── trips.py
│   │   ├── incidents.py
│   │   ├── alerts.py
│   │   └── zones.py
│   │
│   ├── services/
│   └── utils/
│
├── database/
│   ├── schema.sql
│   └── seed.sql
│
├── .env
├── requirements.txt
└── agent.md
```

This is a suggested structure, not a requirement. Do not overengineer the project unnecessarily.

---

# 5. Current `database.py`

The current database connection code is:

```python
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")

engine = create_engine(
    DATABASE_URL,
    echo=True
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
```

The database URL uses:

```text
mysql+pymysql://USERNAME:PASSWORD@HOST:PORT/DATABASE
```

Example:

```env
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/hackathon
```

Do NOT hardcode database credentials in Python.

---

# 6. Current `main.py`

Current FastAPI entry point:

```python
from fastapi import FastAPI, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from .database import get_db


app = FastAPI(
    title="Smart Tourist Safety API",
    description="Backend API for the Smart Tourist Safety System",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "message": "Smart Tourist Safety API is running"
    }


@app.get("/health/database")
def database_health(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT 1"))

    return {
        "database": "connected",
        "result": result.scalar()
    }
```

The server is started with:

```bash
uvicorn app.main:app --reload
```

Expected development server:

```text
http://127.0.0.1:8000
```

Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

---

# 7. Existing Database Schema

The MySQL database contains SIX tables:

```text
admins
users
trips
zones
incidents
alerts
```

Relationships:

```text
admins
   │
   ├── resolves incidents
   │
   └── acknowledges alerts

users
   │
   └── trips
          │
          ├── incidents
          │       │
          │       └── alerts
          │
          └── ...

zones
   │
   └── incidents
```

Detailed schema:

## admins

```text
admin_id       BIGINT PK AUTO_INCREMENT
name           VARCHAR(100) NOT NULL
email          VARCHAR(150) UNIQUE NOT NULL
password_hash  VARCHAR(255) NOT NULL
role           VARCHAR(50) NOT NULL
status         VARCHAR(20) DEFAULT ACTIVE
created_at     TIMESTAMP
```

Roles currently planned:

```text
SUPER_ADMIN
OPERATOR
INSPECTOR
```

---

## users

```text
user_id       BIGINT PK AUTO_INCREMENT
name          VARCHAR(100) NOT NULL
email         VARCHAR(150) UNIQUE NOT NULL
phone         VARCHAR(20) NOT NULL
status        VARCHAR(20) DEFAULT ACTIVE
created_at    TIMESTAMP
```

---

## trips

```text
trip_id       BIGINT PK AUTO_INCREMENT
user_id       BIGINT FK → users.user_id
destination   VARCHAR(150)
start_time    DATETIME
end_time      DATETIME
status        VARCHAR(20)
```

Foreign key:

```text
trips.user_id → users.user_id
```

ON DELETE RESTRICT.

---

## zones

```text
zone_id       BIGINT PK AUTO_INCREMENT
name          VARCHAR(150)
description   TEXT
zone_type     VARCHAR(50)
latitude      DECIMAL(10,6)
longitude     DECIMAL(10,6)
radius        DECIMAL(10,2)
risk_level    VARCHAR(20)
status        VARCHAR(20)
created_at    TIMESTAMP
```

Zone types currently include concepts such as:

```text
SAFE
RESTRICTED
DANGER
```

Risk levels:

```text
LOW
HIGH
CRITICAL
```

---

## incidents

```text
incident_id    BIGINT PK AUTO_INCREMENT
trip_id        BIGINT FK → trips.trip_id
zone_id        BIGINT NULL FK → zones.zone_id
incident_type  VARCHAR(100)
description    TEXT
latitude       DECIMAL(10,6)
longitude      DECIMAL(10,6)
severity       VARCHAR(20)
status         VARCHAR(20)
created_at     TIMESTAMP
resolved_at    DATETIME NULL
resolved_by    BIGINT NULL FK → admins.admin_id
```

Foreign keys:

```text
incidents.trip_id → trips.trip_id
incidents.zone_id → zones.zone_id
incidents.resolved_by → admins.admin_id
```

---

## alerts

```text
alert_id          BIGINT PK AUTO_INCREMENT
incident_id       BIGINT FK → incidents.incident_id
alert_type        VARCHAR(100)
message           TEXT
priority          VARCHAR(20)
status            VARCHAR(20)
created_at        TIMESTAMP
acknowledged_at   DATETIME NULL
acknowledged_by   BIGINT NULL FK → admins.admin_id
closed_at         DATETIME NULL
```

Foreign keys:

```text
alerts.incident_id → incidents.incident_id
alerts.acknowledged_by → admins.admin_id
```

---

# 8. Database Files

The database setup has been separated into:

```text
database/schema.sql
database/seed.sql
```

## schema.sql

Contains:

* database creation
* table creation
* foreign keys
* constraints

It currently contains DROP TABLE statements.

IMPORTANT:

Do not repeatedly run schema.sql once real application data exists because it will delete the tables and data.

## seed.sql

Contains development/test data.

It currently creates:

* 2 admins
* 3 users
* 4 trips
* 3 zones
* 3 incidents
* 3 alerts

The seed data is intentionally retained for development and testing.

It should eventually be treated as test/development data rather than production data.

---

# 9. Current Mock/Test Data

Admins:

```text
Kingston
admin@safety.com
SUPER_ADMIN

Ravi
ravi@safety.com
OPERATOR
```

Users:

```text
Arun Kumar
Rahul Das
Priya Sharma
```

Trips include:

```text
Ooty
Coorg
Munnar
Kodaikanal
```

The Kodaikanal trip is currently active and is intended to provide a current test case for tracking/dashboard development.

IMPORTANT:

The current admin password hashes in seed.sql are dummy prototype values:

```text
$2a$12$DummyHashForPrototype1
$2a$12$DummyHashForPrototype2
```

These are NOT valid production authentication credentials.

When authentication is implemented, generate real password hashes using an appropriate password hashing library.

---

# 10. Backend Work Already Completed

The following are already done:

* MySQL database created
* Database name established as `hackathon`
* Six-table relational schema created
* Foreign keys established
* Development seed data created
* SQLAlchemy installed/configured
* PyMySQL intended as MySQL driver
* `.env` configuration established
* FastAPI application created
* SQLAlchemy session dependency created
* Basic database health endpoint created
* FastAPI can be run using Uvicorn

The database connection should be verified using:

```text
GET /health/database
```

Expected response:

```json
{
    "database": "connected",
    "result": 1
}
```

---

# 11. BACKEND WORK REMAINING

Work should be completed in the following order.

## Step 1 — SQLAlchemy Models

Create:

```text
app/models.py
```

Create SQLAlchemy models matching the EXISTING MySQL tables:

```text
Admin
User
Trip
Zone
Incident
Alert
```

IMPORTANT:

Do not redesign the database schema unless there is a clear technical reason.

The models must match the existing column names, types, primary keys, and foreign keys.

Do not use `Base.metadata.create_all()` to replace the existing schema.

---

# Step 2 — Pydantic Schemas

Create request/response schemas.

Suggested groups:

```text
UserCreate
UserResponse

TripCreate
TripResponse

ZoneCreate
ZoneResponse

IncidentCreate
IncidentResponse

AlertResponse

LoginRequest
LoginResponse
```

Separate request models from response models where appropriate.

Do not expose:

```text
password_hash
```

in API responses.

---

# Step 3 — API Routers

Create REST API endpoints.

Initial API groups:

```text
/api/auth
/api/users
/api/trips
/api/zones
/api/incidents
/api/alerts
/api/admin
```

Minimum useful endpoints:

### Authentication

```text
POST /api/auth/login
```

### Users

```text
POST /api/users
GET /api/users
GET /api/users/{user_id}
```

### Trips

```text
POST /api/trips
GET /api/trips
GET /api/trips/{trip_id}
PATCH /api/trips/{trip_id}
```

### Zones

```text
GET /api/zones
GET /api/zones/{zone_id}
POST /api/zones
PATCH /api/zones/{zone_id}
```

### Incidents

```text
POST /api/incidents
GET /api/incidents
GET /api/incidents/{incident_id}
PATCH /api/incidents/{incident_id}
```

### Alerts

```text
GET /api/alerts
GET /api/alerts/{alert_id}
PATCH /api/alerts/{alert_id}
```

The exact endpoint design can be refined, but keep the API consistent.

---

# Step 4 — Authentication and Authorization

Implement authentication.

Preferred approach:

```text
JWT
```

Password storage:

```text
bcrypt or Argon2
```

Do not store plaintext passwords.

Roles:

```text
SUPER_ADMIN
OPERATOR
INSPECTOR
```

Authorization must ensure that an operator cannot perform actions intended only for super admins, etc.

Client tourists should have their own authentication flow.

---

# Step 5 — CORS

Configure FastAPI CORS so the two frontend applications can communicate with the backend.

During development, allow the known frontend development origins.

Do not use unrestricted:

```text
allow_origins=["*"]
```

for a production deployment.

The final origins should be configured using environment variables where practical.

---

# Step 6 — Test Backend Through Swagger

Before connecting the frontend, test the backend independently using:

```text
http://127.0.0.1:8000/docs
```

Test:

```text
login
create user
get users
create trip
get trips
get zones
create incident
get incidents
get alerts
```

The goal is to prove:

```text
FastAPI
   ↓
SQLAlchemy
   ↓
MySQL
   ↓
FastAPI
```

works correctly.

---

# Step 7 — Connect Client App

The Client App should communicate only with FastAPI.

Initial integration:

```text
Client
  ↓
POST /api/auth/login
  ↓
FastAPI
  ↓
MySQL
  ↓
JWT
  ↓
Client
```

Then integrate:

```text
User profile
Trips
Zones
SOS
Incidents
Alerts
```

---

# Step 8 — Connect Admin App

Admin App should communicate only with FastAPI.

Implement:

```text
Admin login
Dashboard
Users
Trips
Incidents
Alerts
Zone management
Inspector assignment
Analytics
```

The Admin App should use role-based access.

---

# Step 9 — E-FIR Workflow

Implement the workflow:

```text
Filing
   ↓
Verification
   ↓
Assignment
   ↓
Acknowledgement
```

The existing `incidents` table is currently the core incident record.

If a dedicated FIR table becomes necessary, discuss it before changing the database schema.

Do not create unnecessary tables simply for abstraction.

---

# Step 10 — Geofencing

Implement server-side geofence logic.

A zone contains:

```text
latitude
longitude
radius
```

The system should calculate the distance between the tourist's location and the zone center.

If the tourist crosses into a restricted/danger zone:

```text
Location
   ↓
Geofence calculation
   ↓
Zone breach
   ↓
Incident
   ↓
Alert
   ↓
Admin dashboard
```

For the prototype, basic radius-based geofencing is sufficient.

---

# Step 11 — SOS

Client App:

```text
SOS button
    ↓
POST /api/incidents
```

Create:

```text
incident_type = SOS
severity = CRITICAL
```

Then generate an alert.

The Admin App should receive/display the emergency incident.

---

# Step 12 — WebSockets

Add real-time communication for:

* new incidents
* SOS alerts
* geofence breaches
* admin notifications
* status changes

Suggested concept:

```text
Client
  ↓
FastAPI WebSocket
  ↓
Admin App
```

Do not implement WebSockets until the basic REST APIs work.

---

# Step 13 — Notifications

Implement:

* in-app notifications
* WebSocket notifications
* SMS acknowledgement

SMS provider can be integrated later.

For the internal prototype, a simulated SMS service is acceptable if a real SMS provider is not yet available.

---

# Step 14 — Offline-First Client

Client should eventually support:

* cached session
* cached essential trip/zone data
* queued SOS/FIR submissions
* retry when connection returns

This is primarily a Client App feature but requires backend APIs that safely support retries/idempotency.

---

# Step 15 — Analytics

Admin dashboard analytics should eventually include:

```text
Total tourists
Active trips
Open incidents
Critical incidents
Zone breaches
SOS events
Resolved incidents
Incident trends
```

Initially these can be generated through SQL aggregation queries.

---

# Step 16 — AI/ML

AI/ML is NOT the first priority.

First get the complete deterministic system working.

Later implement anomaly detection such as:

```text
Unusual tourist movement
Repeated zone violations
Abnormal route patterns
Repeated SOS misuse
Suspicious activity patterns
```

AI should generate a risk/anomaly score or recommendation rather than directly making irreversible decisions.

---

# 12. Critical End-to-End Demo

The most important prototype flow should be:

```text
Tourist
   │
   │ enters danger zone
   ▼
Client App
   │
   ▼
FastAPI
   │
   ├── location received
   │
   ├── geofence checked
   │
   └── breach detected
   │
   ▼
Incident Created
   │
   ▼
Alert Created
   │
   ▼
WebSocket
   │
   ▼
Admin Dashboard
   │
   ▼
Operator verifies
   │
   ▼
Inspector assigned
   │
   ▼
Notification
   │
   ▼
Tourist receives acknowledgement
```

A second critical demo flow:

```text
Tourist presses SOS
        ↓
Client App
        ↓
FastAPI
        ↓
Incident
        ↓
Alert
        ↓
Admin Dashboard
        ↓
Emergency response
```

These flows are more important for the prototype than having every advanced feature fully implemented.

---

# 13. Development Priorities

Priority order:

```text
HIGH PRIORITY
────────────────────────────
1. SQLAlchemy models
2. Pydantic schemas
3. REST API routes
4. Authentication
5. CORS
6. Swagger testing
7. Client frontend integration
8. Admin frontend integration
9. SOS
10. Incident/alert workflow
11. Geofencing


MEDIUM PRIORITY
────────────────────────────
12. WebSockets
13. Notifications
14. Inspector workflow
15. Analytics
16. Offline queue


LOWER PRIORITY / ADVANCED
────────────────────────────
17. SMS provider
18. AI/ML anomaly detection
19. Advanced offline synchronization
20. Hardware integration
```

---

# 14. Important Development Rules

1. Do not directly connect either frontend to MySQL.

2. Do not rewrite the existing database schema without discussing why.

3. Do not create unnecessary tables.

4. Do not expose password hashes through APIs.

5. Do not hardcode database passwords or JWT secrets.

6. Use environment variables for secrets.

7. Keep Client App and Admin App separate.

8. Keep business logic in the backend rather than duplicating it across frontends.

9. Build and test REST APIs before WebSockets.

10. Do not implement AI before the basic incident workflow works.

11. Preserve the existing six-table database design unless a required feature genuinely cannot be represented by it.

12. Keep the internal hackathon prototype practical. Avoid overengineering.

---

# 15. Current Immediate Task

The next backend task is:

```text
Create SQLAlchemy models matching:

admins
users
trips
zones
incidents
alerts
```

After models are verified:

```text
Pydantic schemas
        ↓
API routers
        ↓
Authentication
        ↓
CORS
        ↓
Swagger testing
        ↓
Frontend integration
```

The first successful frontend integration should be:

```text
Client App
    ↓
GET /api/users
    ↓
FastAPI
    ↓
SQLAlchemy
    ↓
MySQL
    ↓
JSON response
    ↓
Client App displays users
```

Once this works, the basic frontend/backend/database connection is proven.

# END OF AGENT CONTEXT
