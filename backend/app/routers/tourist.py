from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..dependencies import get_current_tourist
from ..schemas.tourist import (
    ChangePasswordRequest,
    CheckinCreate,
    CheckinResponse,
    EmergencyContactCreate,
    EmergencyContactResponse,
    EmergencyContactUpdate,
    LocationCreate,
    LocationResponse,
    NotificationResponse,
    SOSCreate,
    SOSResponse,
    TouristProfileUpdate,
)
from ..schemas.user import UserResponse
from ..security import hash_password, verify_password

router = APIRouter(prefix="/api/tourist", tags=["tourist"])


def _get_own_trip_or_404(trip_id: int, user_id: int, db: Session) -> models.Trip:
    """Fetch a trip and verify it belongs to the calling tourist.

    404 (not 403) on a trip that exists but belongs to someone else, so
    this endpoint doesn't confirm/deny the existence of other tourists'
    trip IDs to an authenticated-but-unauthorized caller.
    """
    trip = db.query(models.Trip).filter(models.Trip.trip_id == trip_id).first()

    if trip is None or trip.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip {trip_id} not found.",
        )

    return trip


# =========================================================================
# STEP 3 — Tourist profile
# =========================================================================


@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: models.User = Depends(get_current_tourist)):
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_my_profile(
    payload: TouristProfileUpdate,
    current_user: models.User = Depends(get_current_tourist),
    db: Session = Depends(get_db),
):
    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(current_user, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists.",
        )

    db.refresh(current_user)
    return current_user


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_my_password(
    payload: ChangePasswordRequest,
    current_user: models.User = Depends(get_current_tourist),
    db: Session = Depends(get_db),
):
    if current_user.password_hash is None or not verify_password(
        payload.current_password, current_user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect.",
        )

    current_user.password_hash = hash_password(payload.new_password)
    db.commit()
    return None


# =========================================================================
# STEP 4 — Emergency contacts
# =========================================================================


def _get_own_contact_or_404(
    contact_id: int, user_id: int, db: Session
) -> models.EmergencyContact:
    contact = (
        db.query(models.EmergencyContact)
        .filter(
            models.EmergencyContact.contact_id == contact_id,
            models.EmergencyContact.user_id == user_id,
        )
        .first()
    )

    if contact is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emergency contact {contact_id} not found.",
        )

    return contact


@router.get("/emergency-contacts", response_model=list[EmergencyContactResponse])
def list_emergency_contacts(
    current_user: models.User = Depends(get_current_tourist),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.EmergencyContact)
        .filter(models.EmergencyContact.user_id == current_user.user_id)
        .order_by(models.EmergencyContact.priority.asc())
        .all()
    )


@router.post(
    "/emergency-contacts",
    response_model=EmergencyContactResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_emergency_contact(
    payload: EmergencyContactCreate,
    current_user: models.User = Depends(get_current_tourist),
    db: Session = Depends(get_db),
):
    contact = models.EmergencyContact(
        user_id=current_user.user_id,
        name=payload.name,
        relationship_label=payload.relationship_label,
        phone=payload.phone,
        email=payload.email,
        priority=payload.priority,
    )

    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.patch(
    "/emergency-contacts/{contact_id}", response_model=EmergencyContactResponse
)
def update_emergency_contact(
    contact_id: int,
    payload: EmergencyContactUpdate,
    current_user: models.User = Depends(get_current_tourist),
    db: Session = Depends(get_db),
):
    contact = _get_own_contact_or_404(contact_id, current_user.user_id, db)

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(contact, field, value)

    db.commit()
    db.refresh(contact)
    return contact


@router.delete(
    "/emergency-contacts/{contact_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_emergency_contact(
    contact_id: int,
    current_user: models.User = Depends(get_current_tourist),
    db: Session = Depends(get_db),
):
    contact = _get_own_contact_or_404(contact_id, current_user.user_id, db)
    db.delete(contact)
    db.commit()
    return None


# =========================================================================
# STEP 5 — Safety check-ins
# =========================================================================


@router.post(
    "/checkins", response_model=CheckinResponse, status_code=status.HTTP_201_CREATED
)
def create_checkin(
    payload: CheckinCreate,
    current_user: models.User = Depends(get_current_tourist),
    db: Session = Depends(get_db),
):
    _get_own_trip_or_404(payload.trip_id, current_user.user_id, db)

    checkin = models.SafetyCheckin(
        user_id=current_user.user_id,
        trip_id=payload.trip_id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        status=payload.status,
        note=payload.note,
    )

    db.add(checkin)
    db.commit()
    db.refresh(checkin)
    return checkin


@router.get("/checkins", response_model=list[CheckinResponse])
def list_my_checkins(
    current_user: models.User = Depends(get_current_tourist),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.SafetyCheckin)
        .filter(models.SafetyCheckin.user_id == current_user.user_id)
        .order_by(models.SafetyCheckin.checked_in_at.desc())
        .all()
    )


# =========================================================================
# STEP 6 — Location history
# =========================================================================


@router.post(
    "/location", response_model=LocationResponse, status_code=status.HTTP_201_CREATED
)
def submit_location(
    payload: LocationCreate,
    current_user: models.User = Depends(get_current_tourist),
    db: Session = Depends(get_db),
):
    if payload.trip_id is not None:
        _get_own_trip_or_404(payload.trip_id, current_user.user_id, db)

    location = models.LocationHistory(
        user_id=current_user.user_id,
        trip_id=payload.trip_id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        accuracy=payload.accuracy,
    )

    db.add(location)
    db.commit()
    db.refresh(location)
    return location


@router.get("/location-history", response_model=list[LocationResponse])
def get_my_location_history(
    limit: int = Query(default=100, ge=1, le=500),
    current_user: models.User = Depends(get_current_tourist),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.LocationHistory)
        .filter(models.LocationHistory.user_id == current_user.user_id)
        .order_by(models.LocationHistory.recorded_at.desc())
        .limit(limit)
        .all()
    )


# =========================================================================
# STEP 7 — SOS
#
# LIMITATION (intentional, documented rather than guessed at): this
# endpoint only writes to sos_events. It does NOT also create an
# `incidents` row. Creating an incident automatically would require
# deciding how sos_events and incidents relate operationally — the
# project's own context docs (PROJECT_CONTEXT.md §13 / project.md
# "Migration Issue" section) flag this as an explicit open decision,
# not yet made. Guessing at it here (e.g. always creating a CRITICAL
# incident per SOS) could conflict with how the admin frontend/officer
# workflow eventually expects incidents to be created. This endpoint is
# shaped so that decision can be layered on top later (e.g. inside this
# same function, or via a follow-up admin action) without changing the
# request/response contract tourists already depend on.
# =========================================================================


@router.post(
    "/sos", response_model=SOSResponse, status_code=status.HTTP_201_CREATED
)
def trigger_sos(
    payload: SOSCreate,
    current_user: models.User = Depends(get_current_tourist),
    db: Session = Depends(get_db),
):
    if payload.trip_id is not None:
        _get_own_trip_or_404(payload.trip_id, current_user.user_id, db)

    sos = models.SOSEvent(
        user_id=current_user.user_id,
        trip_id=payload.trip_id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        trigger_type=payload.trigger_type,
    )

    db.add(sos)
    db.commit()
    db.refresh(sos)
    return sos


@router.get("/sos", response_model=list[SOSResponse])
def list_my_sos(
    current_user: models.User = Depends(get_current_tourist),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.SOSEvent)
        .filter(models.SOSEvent.user_id == current_user.user_id)
        .order_by(models.SOSEvent.triggered_at.desc())
        .all()
    )


# =========================================================================
# STEP 8 — Notifications (persistence/retrieval only; no generation
# system exists yet, per the task spec — that's expected and correct).
# =========================================================================


@router.get("/notifications", response_model=list[NotificationResponse])
def list_my_notifications(
    current_user: models.User = Depends(get_current_tourist),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.Notification)
        .filter(models.Notification.recipient_user_id == current_user.user_id)
        .order_by(models.Notification.created_at.desc())
        .all()
    )


@router.patch(
    "/notifications/{notification_id}/read", response_model=NotificationResponse
)
def mark_notification_read(
    notification_id: int,
    current_user: models.User = Depends(get_current_tourist),
    db: Session = Depends(get_db),
):
    notification = (
        db.query(models.Notification)
        .filter(
            models.Notification.notification_id == notification_id,
            models.Notification.recipient_user_id == current_user.user_id,
        )
        .first()
    )

    if notification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification {notification_id} not found.",
        )

    if not notification.is_read:
        notification.is_read = True
        notification.read_at = datetime.utcnow()
        db.commit()
        db.refresh(notification)

    return notification
