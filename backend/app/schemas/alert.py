from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class AlertUpdate(BaseModel):
    """Payload for PATCH /api/alerts/{alert_id}.

    Covers acknowledgement/close workflow. Alerts are generated
    server-side (Step 10/11), so there is no AlertCreate exposed
    to clients directly.
    """

    status: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    acknowledged_by: Optional[int] = None
    closed_at: Optional[datetime] = None


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    alert_id: int
    incident_id: Optional[int] = None
    alert_type: str
    message: str
    priority: str
    status: str
    created_at: datetime
    acknowledged_at: Optional[datetime] = None
    acknowledged_by: Optional[int] = None
    closed_at: Optional[datetime] = None
