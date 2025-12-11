from datetime import datetime, timedelta, timezone
import jwt
from fastapi import HTTPException, status
from pydantic import BaseModel
from app.core.config import get_settings

settings = get_settings()


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
