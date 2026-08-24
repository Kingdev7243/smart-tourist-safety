import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

# Loose but real validation: digits, spaces, +, -, () — not a full
# libphonenumber implementation, just enough to reject obvious garbage.
_PHONE_PATTERN = re.compile(r"^\+?[0-9][0-9\s\-()]{6,19}$")


def _check_phone(value: Optional[str]) -> Optional[str]:
    if value is None:
        return value
    if not _PHONE_PATTERN.match(value):
        raise ValueError("Phone number must be 7-20 digits, optionally starting with +.")
    return value


# =========================================================================
# Tourist profile (Step 3)
# =========================================================================


class TouristProfileUpdate(BaseModel):
    """PATCH /api/tourist/me.

    Deliberately excludes user_id, status, password_hash, created_at,
    and last_login_at — those are never settable through this endpoint.
    """

    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    phone: Optional[str] = Field(default=None, min_length=7, max_length=20)
    email: Optional[EmailStr] = None

    @field_validator("phone")
    @classmethod
    def _validate_phone(cls, value):
        return _check_phone(value)


class ChangePasswordRequest(BaseModel):
    """POST /api/tourist/change-password. Requires the current password."""

    current_password: str
    new_password: str = Field(min_length=8, max_length=72)


# =========================================================================
# Emergency contacts (Step 4)
# =========================================================================


class EmergencyContactBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    relationship_label: Optional[str] = Field(default=None, max_length=50)
    phone: str = Field(min_length=7, max_length=20)
    email: Optional[EmailStr] = None
    priority: int = Field(default=1, ge=1, le=10)

    @field_validator("phone")
    @classmethod
    def _validate_phone(cls, value):
        return _check_phone(value)


class EmergencyContactCreate(EmergencyContactBase):
    pass


class EmergencyContactUpdate(BaseModel):
    """All fields optional — PATCH semantics."""

    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    relationship_label: Optional[str] = Field(default=None, max_length=50)
    phone: Optional[str] = Field(default=None, min_length=7, max_length=20)
    email: Optional[EmailStr] = None
    priority: Optional[int] = Field(default=None, ge=1, le=10)
    status: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def _validate_phone(cls, value):
        return _check_phone(value)


class EmergencyContactResponse(EmergencyContactBase):
    model_config = ConfigDict(from_attributes=True)

    contact_id: int
    user_id: int
    status: str
    created_at: datetime
    updated_at: datetime


# =========================================================================
# Safety check-ins (Step 5)
# =========================================================================


class CheckinCreate(BaseModel):
    trip_id: int
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    status: str = Field(default="SAFE", max_length=20)
    note: Optional[str] = None


class CheckinResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    checkin_id: int
    user_id: int
    trip_id: int
    latitude: Optional[float]
    longitude: Optional[float]
    status: str
    note: Optional[str]
    checked_in_at: datetime


# =========================================================================
# Location history (Step 6)
# =========================================================================


class LocationCreate(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    accuracy: Optional[float] = Field(default=None, ge=0)
    trip_id: Optional[int] = None


class LocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    location_id: int
    user_id: int
    trip_id: Optional[int]
    latitude: float
    longitude: float
    accuracy: Optional[float]
    recorded_at: datetime


# =========================================================================
# SOS (Step 7)
# =========================================================================


class SOSCreate(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    trip_id: Optional[int] = None
    trigger_type: str = Field(default="MANUAL_SOS", max_length=30)


class SOSResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sos_id: int
    user_id: int
    trip_id: Optional[int]
    incident_id: Optional[int]
    latitude: float
    longitude: float
    trigger_type: str
    status: str
    triggered_at: datetime
    acknowledged_at: Optional[datetime]
    resolved_at: Optional[datetime]


# =========================================================================
# Notifications (Step 8)
# =========================================================================


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    notification_id: int
    notification_type: str
    title: str
    message: str
    related_incident_id: Optional[int]
    related_alert_id: Optional[int]
    related_zone_id: Optional[int]
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime]
