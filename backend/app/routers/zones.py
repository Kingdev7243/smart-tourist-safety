from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..dependencies import require_roles
from ..schemas.zone import ZoneCreate, ZoneResponse, ZoneUpdate

router = APIRouter(prefix="/api/zones", tags=["zones"])


def _get_zone_or_404(zone_id: int, db: Session) -> models.Zone:
    zone = db.query(models.Zone).filter(models.Zone.zone_id == zone_id).first()

    if zone is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Zone {zone_id} not found.",
        )

    return zone


@router.get("", response_model=list[ZoneResponse])
def list_zones(db: Session = Depends(get_db)):
    return db.query(models.Zone).all()


@router.get("/{zone_id}", response_model=ZoneResponse)
def get_zone(zone_id: int, db: Session = Depends(get_db)):
    return _get_zone_or_404(zone_id, db)


@router.post("", response_model=ZoneResponse, status_code=status.HTTP_201_CREATED)
def create_zone(
    payload: ZoneCreate,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(require_roles("SUPER_ADMIN", "OPERATOR")),
):
    zone = models.Zone(
        name=payload.name,
        description=payload.description,
        zone_type=payload.zone_type,
        latitude=payload.latitude,
        longitude=payload.longitude,
        radius=payload.radius,
        risk_level=payload.risk_level,
    )

    db.add(zone)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Zone could not be created due to a database constraint.",
        )

    db.refresh(zone)
    return zone


@router.patch("/{zone_id}", response_model=ZoneResponse)
def update_zone(
    zone_id: int,
    payload: ZoneUpdate,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(require_roles("SUPER_ADMIN", "OPERATOR")),
):
    zone = _get_zone_or_404(zone_id, db)

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(zone, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Zone could not be updated due to a database constraint.",
        )

    db.refresh(zone)
    return zone
