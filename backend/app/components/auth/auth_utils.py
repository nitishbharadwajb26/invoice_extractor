from datetime import datetime, timedelta, timezone
import secrets
import jwt
from fastapi import HTTPException, status
from pydantic import BaseModel
from app.core.config import get_settings

settings = get_settings()

# Temporary auth code storage (use Redis in production)
_auth_codes: dict[str, tuple[str, datetime]] = {}


class TokenData(BaseModel):
    """Token payload data."""
    user_id: int
    email: str
    token_type: str = "access"
    exp: datetime | None = None


class TokenResponse(BaseModel):
    """Token response model."""
    access_token: str
    token_type: str = "bearer"


class AuthCodeRequest(BaseModel):
    """Auth code exchange request."""
    code: str


def create_access_token(user_id: int, email: str) -> str:
    """Generate an access token."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_mins)
    payload = {
        "user_id": user_id,
        "email": email,
        "token_type": "access",
        "exp": expire
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def validate_token(token: str) -> TokenData:
    """Validate and decode a JWT token."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return TokenData(**payload)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Access token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")


def create_auth_code(access_token: str) -> str:
    """Create a temporary auth code that can be exchanged for the access token."""
    _cleanup_expired_codes()

    code = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    _auth_codes[code] = (access_token, expires_at)

    return code


def exchange_auth_code(code: str) -> str:
    """Exchange auth code for access token. Code is single-use."""
    _cleanup_expired_codes()

    if code not in _auth_codes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired auth code")

    access_token, expires_at = _auth_codes.pop(code)  # Remove after use (single-use)

    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Auth code has expired")

    return access_token


def _cleanup_expired_codes():
    """Remove expired auth codes from storage."""
    now = datetime.now(timezone.utc)
    expired = [code for code, (_, exp) in _auth_codes.items() if now > exp]
    for code in expired:
        _auth_codes.pop(code, None)
