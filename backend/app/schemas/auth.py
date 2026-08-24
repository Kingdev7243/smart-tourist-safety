from pydantic import BaseModel, EmailStr, Field

from .admin import AdminResponse
from .user import UserResponse


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    """Shape returned by POST /api/auth/login.

    access_token/token_type are placeholders for the JWT-based auth
    implemented in Step 4 (agent.md Section: Step 4 — Authentication
    and Authorization). Defined now so routers can be written against
    a stable response contract.
    """

    access_token: str
    token_type: str = "bearer"
    admin: AdminResponse


# ---------------------------------------------------------------------
# Tourist authentication (added alongside POST /api/auth/register and
# POST /api/auth/tourist/login). Kept separate from the admin
# LoginRequest/LoginResponse above so the two flows never share a
# response contract, even though the shapes currently look similar.
# ---------------------------------------------------------------------


class RegisterRequest(BaseModel):
    """Payload for POST /api/auth/register (tourist self-registration)."""

    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=20)
    # bcrypt silently truncates/ignores input beyond 72 bytes, so cap
    # the password length rather than let that happen unnoticed.
    password: str = Field(min_length=8, max_length=72)


class TouristLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TouristLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
