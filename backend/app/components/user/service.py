from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.components.user.schema import UserSchema
from app.components.user.model import UserResponse
from app.core.logger import get_logger

logger = get_logger(__name__)


class UserService:
    """User operations service."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int) -> UserSchema | None:
        """Get user by ID."""
        return self.db.query(UserSchema).filter(UserSchema.id == user_id).first()

    def get_by_email(self, email: str) -> UserSchema | None:
        """Get user by email."""
        return self.db.query(UserSchema).filter(UserSchema.email == email).first()

    def create_or_update(self, email: str, name: str | None, access_token: str, refresh_token: str, extraction_mode: str = "local") -> UserSchema:
        """Create or update user with OAuth tokens."""
        user = self.get_by_email(email)

        if user:
            user.name = name
            user.google_access_token = access_token
            user.google_refresh_token = refresh_token
            user.extraction_mode = extraction_mode
            user.updated_at = datetime.now(timezone.utc)
            logger.info(f"Updated user: {email}")
        else:
            user = UserSchema(
                email=email,
                name=name,
                google_access_token=access_token,
                google_refresh_token=refresh_token,
                extraction_mode=extraction_mode
            )
            self.db.add(user)
            logger.info(f"Created user: {email}")

        self.db.commit()
        self.db.refresh(user)
        return user

    def update_extraction_mode(self, user_id: int, mode: str) -> UserSchema | None:
        """Update user's extraction mode preference."""
        user = self.get_by_id(user_id)
        if user:
            user.extraction_mode = mode
            user.updated_at = datetime.now(timezone.utc)
            self.db.commit()
            self.db.refresh(user)
            logger.info(f"Updated extraction mode for user {user_id}: {mode}")
        return user

    def update_tokens(self, user_id: int, access_token: str, refresh_token: str | None = None) -> UserSchema | None:
        """Update user's OAuth tokens."""
        user = self.get_by_id(user_id)
        if user:
            user.google_access_token = access_token
            if refresh_token:
                user.google_refresh_token = refresh_token
            user.updated_at = datetime.now(timezone.utc)
            self.db.commit()
            self.db.refresh(user)
        return user

    def clear_tokens(self, user_id: int) -> bool:
        """Clear user's OAuth tokens on logout."""
        user = self.get_by_id(user_id)
        if user:
            user.google_access_token = None
            user.google_refresh_token = None
            user.updated_at = datetime.now(timezone.utc)
            self.db.commit()
            logger.info(f"Cleared tokens for user {user_id}")
            return True
        return False
