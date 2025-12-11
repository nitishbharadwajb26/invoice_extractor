from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.components.auth.auth_utils import validate_token, TokenData
from app.components.user.schema import UserSchema
from app.core.logger import get_logger

logger = get_logger(__name__)
oauth2_bearer = HTTPBearer()


def validate_access_token(
    http: HTTPAuthorizationCredentials = Depends(oauth2_bearer),
    db: Session = Depends(get_db)
) -> TokenData:
    """Dependency for validating the access token."""
    if not http or not http.credentials:
        logger.error("No access token provided")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Access token is required")

    try:
        token_data = validate_token(http.credentials)

        if token_data.token_type != "access":
            logger.error("Invalid token type")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid token type")

        # Verify user exists and has Gmail connected
        user = db.query(UserSchema).filter(UserSchema.id == token_data.user_id).first()
        if not user:
            logger.error(f"User not found: {token_data.user_id}")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

        if not user.google_access_token:
            logger.error(f"User not connected to Gmail: {token_data.user_id}")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not connected to Gmail")

        logger.info(f"Access token validated for user: {token_data.email}")
        return token_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token validation error: {e}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")
