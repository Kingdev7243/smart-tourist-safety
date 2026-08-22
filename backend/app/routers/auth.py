from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..schemas.admin import AdminResponse
from ..schemas.auth import LoginRequest, LoginResponse
from ..security import create_access_token, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    admin = (
        db.query(models.Admin).filter(models.Admin.email == payload.email).first()
    )

    # Deliberately identical error for "no such email" and "wrong password"
    # so the response never reveals which part was incorrect.
    if admin is None or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    if admin.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This admin account is inactive.",
        )

    token = create_access_token(admin_id=admin.admin_id, role=admin.role)

    return LoginResponse(
        access_token=token,
        token_type="bearer",
        admin=AdminResponse.model_validate(admin),
    )
