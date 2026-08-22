from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ZoneBase(BaseModel):
    name: str
    description: Optional[str] = None
    zone_type: str
    latitude: Decimal
    longitude: Decimal
    radius: Decimal
    risk_level: str


class ZoneCreate(ZoneBase):
    """Payload for POST /api/zones"""
    pass


class ZoneUpdate(BaseModel):
    """Payload for PATCH /api/zones/{zone_id}. All fields optional."""

    name: Optional[str] = None
    description: Optional[str] = None
    zone_type: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    radius: Optional[Decimal] = None
    risk_level: Optional[str] = None
    status: Optional[str] = None


class ZoneResponse(ZoneBase):
    model_config = ConfigDict(from_attributes=True)

    zone_id: int
    status: str
    created_at: datetime
