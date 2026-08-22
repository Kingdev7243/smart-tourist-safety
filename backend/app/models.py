from sqlalchemy import (
    BigInteger,
    Column,
    DateTime,
    Numeric,
    ForeignKey,
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


class User(Base):
    __tablename__ = "users"

    user_id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False, unique=True)
    phone = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False, server_default="ACTIVE")
    created_at = Column(TIMESTAMP, server_default=func.now())

    trips = relationship("Trip", back_populates="user")


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
