import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from . import models
from .database import get_db
from .security import decode_access_token

# Swagger will show an "Authorize" button that accepts a raw bearer token
# (paste the access_token returned from POST /api/auth/login).
bearer_scheme = HTTPBearer(auto_error=True)

_AUTH_HEADERS = {"WWW-Authenticate": "Bearer"}


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.Admin:
    """Resolve the calling admin from a Bearer JWT.

    Rejects: missing/malformed token, expired token, token for an admin
    that no longer exists, and inactive admins.
    """
    token = credentials.credentials

    try:
        payload = decode_access_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired.",
            headers=_AUTH_HEADERS,
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers=_AUTH_HEADERS,
        )

    admin_id = payload.get("sub")
    if admin_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers=_AUTH_HEADERS,
        )

    admin = (
        db.query(models.Admin).filter(models.Admin.admin_id == int(admin_id)).first()
    )

    if admin is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin account no longer exists.",
            headers=_AUTH_HEADERS,
        )

    if admin.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This admin account is inactive.",
        )

    return admin


def require_roles(*roles: str):
    """Dependency factory: require the current admin to hold one of `roles`.

    Usage: Depends(require_roles("SUPER_ADMIN", "OPERATOR"))
    """

    def checker(admin: models.Admin = Depends(get_current_admin)) -> models.Admin:
        if admin.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )
        return admin

    return checker


# Convenience alias for "any authenticated admin, any role"
require_admin = get_current_admin
