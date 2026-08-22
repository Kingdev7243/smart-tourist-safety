from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..schemas.trip import TripCreate, TripResponse, TripUpdate

router = APIRouter(prefix="/api/trips", tags=["trips"])


def _get_trip_or_404(trip_id: int, db: Session) -> models.Trip:
    trip = db.query(models.Trip).filter(models.Trip.trip_id == trip_id).first()

    if trip is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip {trip_id} not found.",
        )

    return trip


@router.post("", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
def create_trip(payload: TripCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.user_id == payload.user_id).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {payload.user_id} not found.",
        )

    trip = models.Trip(
        user_id=payload.user_id,
        destination=payload.destination,
        start_time=payload.start_time,
        end_time=payload.end_time,
    )

    db.add(trip)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trip could not be created due to a database constraint.",
        )

    db.refresh(trip)
    return trip


@router.get("", response_model=list[TripResponse])
def list_trips(db: Session = Depends(get_db)):
    return db.query(models.Trip).all()


@router.get("/{trip_id}", response_model=TripResponse)
def get_trip(trip_id: int, db: Session = Depends(get_db)):
    return _get_trip_or_404(trip_id, db)


@router.patch("/{trip_id}", response_model=TripResponse)
def update_trip(trip_id: int, payload: TripUpdate, db: Session = Depends(get_db)):
    trip = _get_trip_or_404(trip_id, db)

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(trip, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Trip could not be updated due to a database constraint.",
        )

    db.refresh(trip)
    return trip
