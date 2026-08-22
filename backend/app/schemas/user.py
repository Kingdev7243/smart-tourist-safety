from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: str


class UserCreate(UserBase):
    """Payload for POST /api/users"""
    pass


class UserResponse(UserBase):
    """Response shape for user records. Never includes password_hash
    (users table has no password_hash column, but this mirrors the
    same convention used for AdminResponse)."""

    model_config = ConfigDict(from_attributes=True)

    user_id: int
    status: str
    created_at: datetime
