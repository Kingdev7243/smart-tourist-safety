from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class AdminResponse(BaseModel):
    """Response shape for admin records.

    password_hash is intentionally excluded per agent.md rule:
    'Do not expose password_hash in API responses.'
    """

    model_config = ConfigDict(from_attributes=True)

    admin_id: int
    name: str
    email: EmailStr
    role: str
    status: str
    created_at: datetime
