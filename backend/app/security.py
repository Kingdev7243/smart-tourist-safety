from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from .config import JWT_ALGORITHM, JWT_EXPIRE_MINUTES, JWT_SECRET_KEY


def hash_password(password: str) -> str:
    """Hash a plaintext password for storage. Never store the plaintext."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Check a plaintext password against a stored bcrypt hash.

    Returns False (instead of raising) for malformed/legacy hashes, so a
    leftover dummy prototype hash just fails verification cleanly rather
    than crashing the login endpoint.
    """
    try:
        return bcrypt.checkpw(
            password.encode("utf-8"), password_hash.encode("utf-8")
        )
    except (ValueError, TypeError):
        return False


def _build_token(subject_id: int, role: str, token_type: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(subject_id),
        "role": role,
        # "type" distinguishes admin tokens from tourist tokens so a
        # tourist JWT can never satisfy an admin-only dependency (and
        # vice versa), even if the numeric IDs happen to collide.
        "type": token_type,
        "iat": now,
        "exp": now + timedelta(minutes=JWT_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def create_access_token(admin_id: int, role: str) -> str:
    """Issue an admin JWT. Unchanged call signature/contract."""
    return _build_token(subject_id=admin_id, role=role, token_type="admin")


def create_tourist_access_token(user_id: int) -> str:
    """Issue a tourist JWT. Tourists have no admin 'role' concept, so the
    role claim is fixed to 'TOURIST' purely for readability/debugging —
    authorization never branches on it (see dependencies.get_current_tourist)."""
    return _build_token(subject_id=user_id, role="TOURIST", token_type="tourist")


def decode_access_token(token: str) -> dict:
    """Raises jwt.ExpiredSignatureError or jwt.InvalidTokenError on failure."""
    return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
