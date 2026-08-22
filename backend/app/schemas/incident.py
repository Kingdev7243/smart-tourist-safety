from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict


class IncidentBase(BaseModel):
    trip_id: int
    zone_id: Optional[int] = None
    incident_type: str
    description: Optional[str] = None
    latitude: Decimal
    longitude: Decimal
    severity: str


class IncidentCreate(IncidentBase):
    """Payload for POST /api/incidents.

    Used directly by the SOS flow as well (Step 11): the client sets
    incident_type="SOS" and severity="CRITICAL" through this same schema.
    """
    pass


class IncidentUpdate(BaseModel):
    """Payload for PATCH /api/incidents/{incident_id}.

    Covers the operator/inspector workflow: updating status,
    marking resolved_at/resolved_by once an incident is closed.
    """

    zone_id: Optional[int] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[int] = None


class IncidentResponse(IncidentBase):
    model_config = ConfigDict(from_attributes=True)

    incident_id: int
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[int] = None
