from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..schemas.admin import AdminResponse
from ..schemas.auth import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    TouristLoginRequest,
    TouristLoginResponse,
)
from ..schemas.user import UserResponse
from ..security import (
    create_access_token,
    create_tourist_access_token,
    hash_password,
    verify_password,
)

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


# ---------------------------------------------------------------------
# Tourist authentication
#
# Deliberately kept in this router (not a new file) because it's the
# same concern — issuing credentials — as the admin login above, and
# agent.md/project.md both say not to duplicate the JWT implementation.
# Existing POST /api/users (see routers/users.py) is untouched and
# still works exactly as before: it's a lighter-weight, no-password
# tourist record creation used elsewhere (e.g. by the admin frontend).
# This endpoint is the self-service registration flow with a password.
# ---------------------------------------------------------------------


@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
def register_tourist(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = (
        db.query(models.User).filter(models.User.email == payload.email).first()
    )

    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists.",
        )

    user = models.User(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        # status defaults to ACTIVE at the DB level; not set explicitly
        # here so this never accidentally grants anything beyond that.
    )

    db.add(user)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists.",
        )

    db.refresh(user)
    return user


@router.post("/tourist/login", response_model=TouristLoginResponse)
def tourist_login(payload: TouristLoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()

    # Identical error for "no such email", "wrong password", and "this
    # user has no password set yet" (pre-existing seeded users), same
    # rationale as the admin login above: never reveal which part was
    # wrong, and never let a NULL password_hash short-circuit into a
    # different (more informative) error path.
    if (
        user is None
        or user.password_hash is None
        or not verify_password(payload.password, user.password_hash)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    if user.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is inactive.",
        )

    # Naive UTC to match the plain DATETIME column (no tz stored in MySQL).
    user.last_login_at = datetime.utcnow()
    db.commit()
    db.refresh(user)

    token = create_tourist_access_token(user_id=user.user_id)

    return TouristLoginResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )
