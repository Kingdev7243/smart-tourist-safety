from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..dependencies import require_roles
from ..schemas.incident import IncidentCreate, IncidentResponse, IncidentUpdate

router = APIRouter(prefix="/api/incidents", tags=["incidents"])


def _get_incident_or_404(incident_id: int, db: Session) -> models.Incident:
    incident = (
        db.query(models.Incident)
        .filter(models.Incident.incident_id == incident_id)
        .first()
    )

    if incident is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident {incident_id} not found.",
        )

    return incident


@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
def create_incident(payload: IncidentCreate, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.trip_id == payload.trip_id).first()

    if trip is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip {payload.trip_id} not found.",
        )

    if payload.zone_id is not None:
        zone = (
            db.query(models.Zone)
            .filter(models.Zone.zone_id == payload.zone_id)
            .first()
        )

        if zone is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Zone {payload.zone_id} not found.",
            )

    incident = models.Incident(
        trip_id=payload.trip_id,
        zone_id=payload.zone_id,
        incident_type=payload.incident_type,
        description=payload.description,
        latitude=payload.latitude,
        longitude=payload.longitude,
        severity=payload.severity,
    )

    db.add(incident)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incident could not be created due to a database constraint.",
        )

    db.refresh(incident)
    return incident


@router.get("", response_model=list[IncidentResponse])
def list_incidents(db: Session = Depends(get_db)):
    return db.query(models.Incident).all()


@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    return _get_incident_or_404(incident_id, db)


@router.patch("/{incident_id}", response_model=IncidentResponse)
def update_incident(
    incident_id: int,
    payload: IncidentUpdate,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(
        require_roles("SUPER_ADMIN", "OPERATOR", "INSPECTOR")
    ),
):
    incident = _get_incident_or_404(incident_id, db)

    update_data = payload.model_dump(exclude_unset=True)

    if "zone_id" in update_data and update_data["zone_id"] is not None:
        zone = (
            db.query(models.Zone)
            .filter(models.Zone.zone_id == update_data["zone_id"])
            .first()
        )

        if zone is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Zone {update_data['zone_id']} not found.",
            )

    if "resolved_by" in update_data and update_data["resolved_by"] is not None:
        admin = (
            db.query(models.Admin)
            .filter(models.Admin.admin_id == update_data["resolved_by"])
            .first()
        )

        if admin is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Admin {update_data['resolved_by']} not found.",
            )

    for field, value in update_data.items():
        setattr(incident, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incident could not be updated due to a database constraint.",
        )

    db.refresh(incident)
    return incident
