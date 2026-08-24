from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    Numeric,
    ForeignKey,
    Integer,
    String,
    Text,
    TIMESTAMP,
    func,
)
from sqlalchemy.orm import relationship

from .database import Base


class Admin(Base):
    __tablename__ = "admins"

    admin_id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False, server_default="ACTIVE")
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Incidents resolved by this admin
    resolved_incidents = relationship(
        "Incident",
        back_populates="resolver",
        foreign_keys="Incident.resolved_by",
    )

    # Alerts acknowledged by this admin
    acknowledged_alerts = relationship(
        "Alert",
        back_populates="acknowledger",
        foreign_keys="Alert.acknowledged_by",
    )

    # NEW (Step 5): 1:1 officer profile, if this admin is an officer
    officer_profile = relationship(
        "OfficerProfile",
        back_populates="admin",
        uselist=False,
        foreign_keys="OfficerProfile.admin_id",
    )

    # NEW (Step 5): incidents assigned to this admin/officer
    incident_assignments = relationship(
        "IncidentAssignment",
        back_populates="assigned_admin",
        foreign_keys="IncidentAssignment.assigned_admin_id",
    )

    # NEW (Step 5): notes/evidence this admin authored
    incident_notes = relationship(
        "IncidentNote",
        back_populates="creator",
        foreign_keys="IncidentNote.created_by",
    )

    # NEW (Step 5): SOS events this admin handled
    handled_sos_events = relationship(
        "SOSEvent",
        back_populates="handler",
        foreign_keys="SOSEvent.handled_by",
    )

    # NEW (Step 5): in-app notifications sent to this admin
    notifications = relationship(
        "Notification",
        back_populates="recipient_admin",
        foreign_keys="Notification.recipient_admin_id",
    )

    # NEW (Step 5): audit log entries attributed to this admin
    audit_logs = relationship(
        "AuditLog",
        back_populates="admin",
        foreign_keys="AuditLog.admin_id",
    )


class User(Base):
    __tablename__ = "users"

    user_id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False, unique=True)
    phone = Column(String(20), nullable=False)

    # NEW (Step 5): tourist authentication support. Nullable because
    # existing seeded users predate this column.
    password_hash = Column(String(255), nullable=True)

    status = Column(String(20), nullable=False, server_default="ACTIVE")

    # NEW (Step 5): last successful tourist login.
    last_login_at = Column(DateTime, nullable=True)

    created_at = Column(TIMESTAMP, server_default=func.now())

    # NEW (Step 5): standard updated_at bookkeeping column.
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    trips = relationship("Trip", back_populates="user")

    # NEW (Step 5)
    emergency_contacts = relationship("EmergencyContact", back_populates="user")
    location_history = relationship("LocationHistory", back_populates="user")
    geofence_events = relationship("GeofenceEvent", back_populates="user")
    safety_checkins = relationship("SafetyCheckin", back_populates="user")
    sos_events = relationship("SOSEvent", back_populates="user")
    notifications = relationship(
        "Notification",
        back_populates="recipient_user",
        foreign_keys="Notification.recipient_user_id",
    )


class Trip(Base):
    __tablename__ = "trips"

    trip_id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(
        BigInteger,
        ForeignKey("users.user_id", ondelete="RESTRICT"),
        nullable=False,
    )
    destination = Column(String(150), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    status = Column(String(20), nullable=False, server_default="ACTIVE")

    user = relationship("User", back_populates="trips")
    incidents = relationship("Incident", back_populates="trip")

    # NEW (Step 5)
    location_history = relationship("LocationHistory", back_populates="trip")
    geofence_events = relationship("GeofenceEvent", back_populates="trip")
    safety_checkins = relationship("SafetyCheckin", back_populates="trip")
    sos_events = relationship("SOSEvent", back_populates="trip")


class Zone(Base):
    __tablename__ = "zones"

    zone_id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    zone_type = Column(String(50), nullable=False)
    latitude = Column(Numeric(10, 6), nullable=False)
    longitude = Column(Numeric(10, 6), nullable=False)
    radius = Column(Numeric(10, 2), nullable=False)
    risk_level = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False, server_default="ACTIVE")
    created_at = Column(TIMESTAMP, server_default=func.now())

    incidents = relationship("Incident", back_populates="zone")

    # NEW (Step 5)
    geofence_events = relationship("GeofenceEvent", back_populates="zone")


class Incident(Base):
    __tablename__ = "incidents"

    incident_id = Column(BigInteger, primary_key=True, autoincrement=True)
    trip_id = Column(
        BigInteger,
        ForeignKey("trips.trip_id", ondelete="RESTRICT"),
        nullable=False,
    )
    zone_id = Column(
        BigInteger,
        ForeignKey("zones.zone_id", ondelete="SET NULL"),
        nullable=True,
    )
    incident_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    latitude = Column(Numeric(10, 6), nullable=False)
    longitude = Column(Numeric(10, 6), nullable=False)
    severity = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False, server_default="OPEN")
    created_at = Column(TIMESTAMP, server_default=func.now())
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(
        BigInteger,
        ForeignKey("admins.admin_id", ondelete="SET NULL"),
        nullable=True,
    )

    trip = relationship("Trip", back_populates="incidents")
    zone = relationship("Zone", back_populates="incidents")
    resolver = relationship(
        "Admin",
        back_populates="resolved_incidents",
        foreign_keys=[resolved_by],
    )
    alerts = relationship("Alert", back_populates="incident")

    # NEW (Step 5)
    sos_events = relationship("SOSEvent", back_populates="incident")
    assignments = relationship("IncidentAssignment", back_populates="incident")
    notes = relationship("IncidentNote", back_populates="incident")


class Alert(Base):
    __tablename__ = "alerts"

    alert_id = Column(BigInteger, primary_key=True, autoincrement=True)
    incident_id = Column(
        BigInteger,
        ForeignKey("incidents.incident_id", ondelete="RESTRICT"),
        nullable=True,
    )
    alert_type = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    priority = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False, server_default="NEW")
    created_at = Column(TIMESTAMP, server_default=func.now())
    acknowledged_at = Column(DateTime, nullable=True)
    acknowledged_by = Column(
        BigInteger,
        ForeignKey("admins.admin_id", ondelete="SET NULL"),
        nullable=True,
    )
    closed_at = Column(DateTime, nullable=True)

    incident = relationship("Incident", back_populates="alerts")
    acknowledger = relationship(
        "Admin",
        back_populates="acknowledged_alerts",
        foreign_keys=[acknowledged_by],
    )


# =========================================================================
# STEP 5 — SCHEMA EXPANSION MODELS
# Mirrors database/schema.sql exactly. See that file for column-by-column
# design notes (ON DELETE choices, nullability rationale, etc.).
# =========================================================================


class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    contact_id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(
        BigInteger,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
    )
    name = Column(String(100), nullable=False)
    relationship_label = Column("relationship", String(50), nullable=True)
    phone = Column(String(20), nullable=False)
    email = Column(String(150), nullable=True)
    priority = Column(Integer, nullable=False, server_default="1")
    status = Column(String(20), nullable=False, server_default="ACTIVE")
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="emergency_contacts")


class LocationHistory(Base):
    __tablename__ = "location_history"

    location_id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(
        BigInteger,
        ForeignKey("users.user_id", ondelete="RESTRICT"),
        nullable=False,
    )
    trip_id = Column(
        BigInteger,
        ForeignKey("trips.trip_id", ondelete="SET NULL"),
        nullable=True,
    )
    latitude = Column(Numeric(10, 6), nullable=False)
    longitude = Column(Numeric(10, 6), nullable=False)
    accuracy = Column(Numeric(10, 2), nullable=True)
    recorded_at = Column(TIMESTAMP, nullable=False, server_default=func.now())

    user = relationship("User", back_populates="location_history")
    trip = relationship("Trip", back_populates="location_history")


class GeofenceEvent(Base):
    __tablename__ = "geofence_events"

    event_id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(
        BigInteger,
        ForeignKey("users.user_id", ondelete="RESTRICT"),
        nullable=False,
    )
    trip_id = Column(
        BigInteger,
        ForeignKey("trips.trip_id", ondelete="SET NULL"),
        nullable=True,
    )
    zone_id = Column(
        BigInteger,
        ForeignKey("zones.zone_id", ondelete="SET NULL"),
        nullable=True,
    )
    event_type = Column(String(20), nullable=False)  # ENTERED/EXITED/DWELLING/VIOLATION
    latitude = Column(Numeric(10, 6), nullable=False)
    longitude = Column(Numeric(10, 6), nullable=False)
    occurred_at = Column(TIMESTAMP, nullable=False, server_default=func.now())
    severity = Column(String(20), nullable=True)
    status = Column(String(20), nullable=False, server_default="UNHANDLED")

    user = relationship("User", back_populates="geofence_events")
    trip = relationship("Trip", back_populates="geofence_events")
    zone = relationship("Zone", back_populates="geofence_events")


class SafetyCheckin(Base):
    __tablename__ = "safety_checkins"

    checkin_id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(
        BigInteger,
        ForeignKey("users.user_id", ondelete="RESTRICT"),
        nullable=False,
    )
    trip_id = Column(
        BigInteger,
        ForeignKey("trips.trip_id", ondelete="RESTRICT"),
        nullable=False,
    )
    latitude = Column(Numeric(10, 6), nullable=True)
    longitude = Column(Numeric(10, 6), nullable=True)
    status = Column(String(20), nullable=False, server_default="SAFE")
    note = Column(Text, nullable=True)
    checked_in_at = Column(TIMESTAMP, nullable=False, server_default=func.now())

    user = relationship("User", back_populates="safety_checkins")
    trip = relationship("Trip", back_populates="safety_checkins")


class SOSEvent(Base):
    __tablename__ = "sos_events"

    sos_id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(
        BigInteger,
        ForeignKey("users.user_id", ondelete="RESTRICT"),
        nullable=False,
    )
    trip_id = Column(
        BigInteger,
        ForeignKey("trips.trip_id", ondelete="SET NULL"),
        nullable=True,
    )
    incident_id = Column(
        BigInteger,
        ForeignKey("incidents.incident_id", ondelete="SET NULL"),
        nullable=True,
    )
    latitude = Column(Numeric(10, 6), nullable=False)
    longitude = Column(Numeric(10, 6), nullable=False)
    trigger_type = Column(String(30), nullable=False, server_default="MANUAL_SOS")
    status = Column(String(20), nullable=False, server_default="TRIGGERED")
    triggered_at = Column(TIMESTAMP, nullable=False, server_default=func.now())
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    handled_by = Column(
        BigInteger,
        ForeignKey("admins.admin_id", ondelete="SET NULL"),
        nullable=True,
    )

    user = relationship("User", back_populates="sos_events")
    trip = relationship("Trip", back_populates="sos_events")
    incident = relationship("Incident", back_populates="sos_events")
    handler = relationship(
        "Admin",
        back_populates="handled_sos_events",
        foreign_keys=[handled_by],
    )


class OfficerProfile(Base):
    __tablename__ = "officer_profiles"

    # 1:1 extension of admins — admin_id is both PK and FK, not a
    # separate surrogate key or a separate auth system.
    admin_id = Column(
        BigInteger,
        ForeignKey("admins.admin_id", ondelete="CASCADE"),
        primary_key=True,
    )
    badge_number = Column(String(50), nullable=True, unique=True)
    phone = Column(String(20), nullable=True)
    department = Column(String(100), nullable=True)
    availability_status = Column(String(20), nullable=False, server_default="AVAILABLE")

    # Denormalized convenience pointer only. incident_assignments is
    # the source of truth for assignment history.
    current_incident_id = Column(
        BigInteger,
        ForeignKey("incidents.incident_id", ondelete="SET NULL"),
        nullable=True,
    )

    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    admin = relationship(
        "Admin",
        back_populates="officer_profile",
        foreign_keys=[admin_id],
    )
    current_incident = relationship("Incident", foreign_keys=[current_incident_id])


class IncidentAssignment(Base):
    __tablename__ = "incident_assignments"

    assignment_id = Column(BigInteger, primary_key=True, autoincrement=True)
    incident_id = Column(
        BigInteger,
        ForeignKey("incidents.incident_id", ondelete="CASCADE"),
        nullable=False,
    )
    assigned_admin_id = Column(
        BigInteger,
        ForeignKey("admins.admin_id", ondelete="RESTRICT"),
        nullable=False,
    )
    assigned_at = Column(TIMESTAMP, server_default=func.now())
    accepted_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String(20), nullable=False, server_default="ASSIGNED")
    notes = Column(Text, nullable=True)

    incident = relationship("Incident", back_populates="assignments")
    assigned_admin = relationship(
        "Admin",
        back_populates="incident_assignments",
        foreign_keys=[assigned_admin_id],
    )


class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(BigInteger, primary_key=True, autoincrement=True)
    recipient_user_id = Column(
        BigInteger,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=True,
    )
    recipient_admin_id = Column(
        BigInteger,
        ForeignKey("admins.admin_id", ondelete="CASCADE"),
        nullable=True,
    )
    notification_type = Column(String(50), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    related_incident_id = Column(
        BigInteger,
        ForeignKey("incidents.incident_id", ondelete="SET NULL"),
        nullable=True,
    )
    related_alert_id = Column(
        BigInteger,
        ForeignKey("alerts.alert_id", ondelete="SET NULL"),
        nullable=True,
    )
    related_zone_id = Column(
        BigInteger,
        ForeignKey("zones.zone_id", ondelete="SET NULL"),
        nullable=True,
    )
    is_read = Column(Boolean, nullable=False, server_default="0")
    created_at = Column(TIMESTAMP, server_default=func.now())
    read_at = Column(DateTime, nullable=True)

    __table_args__ = (
        CheckConstraint(
            "(recipient_user_id IS NOT NULL AND recipient_admin_id IS NULL) OR "
            "(recipient_user_id IS NULL AND recipient_admin_id IS NOT NULL)",
            name="chk_notifications_single_recipient",
        ),
    )

    recipient_user = relationship(
        "User",
        back_populates="notifications",
        foreign_keys=[recipient_user_id],
    )
    recipient_admin = relationship(
        "Admin",
        back_populates="notifications",
        foreign_keys=[recipient_admin_id],
    )
    related_incident = relationship("Incident", foreign_keys=[related_incident_id])
    related_alert = relationship("Alert", foreign_keys=[related_alert_id])
    related_zone = relationship("Zone", foreign_keys=[related_zone_id])


class IncidentNote(Base):
    __tablename__ = "incident_notes"

    note_id = Column(BigInteger, primary_key=True, autoincrement=True)
    incident_id = Column(
        BigInteger,
        ForeignKey("incidents.incident_id", ondelete="CASCADE"),
        nullable=False,
    )
    created_by = Column(
        BigInteger,
        ForeignKey("admins.admin_id", ondelete="RESTRICT"),
        nullable=False,
    )
    note_type = Column(String(50), nullable=False, server_default="NOTE")
    description = Column(Text, nullable=True)
    file_url = Column(String(500), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    incident = relationship("Incident", back_populates="notes")
    creator = relationship(
        "Admin",
        back_populates="incident_notes",
        foreign_keys=[created_by],
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    audit_id = Column(BigInteger, primary_key=True, autoincrement=True)
    admin_id = Column(
        BigInteger,
        ForeignKey("admins.admin_id", ondelete="SET NULL"),
        nullable=True,
    )
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(BigInteger, nullable=True)
    description = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    admin = relationship(
        "Admin",
        back_populates="audit_logs",
        foreign_keys=[admin_id],
    )
