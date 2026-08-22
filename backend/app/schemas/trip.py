from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class TripBase(BaseModel):
    destination: str
    start_time: datetime
    end_time: datetime


class TripCreate(TripBase):
    """Payload for POST /api/trips"""

    user_id: int


class TripUpdate(BaseModel):
    """Payload for PATCH /api/trips/{trip_id}.

    All fields optional since a PATCH may update only status
    (e.g. ACTIVE -> COMPLETED) without touching the rest of the trip.
    """

    destination: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[str] = None


class TripResponse(TripBase):
    model_config = ConfigDict(from_attributes=True)

    trip_id: int
    user_id: int
    status: str
