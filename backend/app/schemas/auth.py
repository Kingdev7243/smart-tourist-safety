from pydantic import BaseModel, EmailStr

from .admin import AdminResponse


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
