import hashlib
import requests
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

from app.database import get_db
from app.core.config import get_settings
from app.core.security import encrypt_token, decrypt_token
from app.core.logger import get_logger
from app.components.user.schema import UserSchema
from app.components.user.service import UserService

logger = get_logger(__name__)
settings = get_settings()
security = HTTPBearer()

SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
]


class AuthService:
    """Google OAuth authentication service."""

    def __init__(self, db: Session):
        self.db = db
        self.user_service = UserService(db)

    def get_oauth_url(self, extraction_mode: str = "local") -> str:
        """Generate Google OAuth authorization URL."""
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [settings.google_redirect_uri],
                }
            },
            scopes=SCOPES,
        )
        flow.redirect_uri = settings.google_redirect_uri

        auth_url, _ = flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            prompt="consent",
            state=extraction_mode,
        )
        return auth_url

    def handle_callback(self, code: str, extraction_mode: str = "local") -> tuple[UserSchema, str]:
        """Handle OAuth callback and create/update user."""
        # Exchange code for tokens directly to avoid scope mismatch error
        token_response = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": settings.google_redirect_uri,
            },
        )
        token_data = token_response.json()

        if "error" in token_data:
            raise Exception(f"Token exchange failed: {token_data.get('error_description', token_data['error'])}")

        credentials = Credentials(
            token=token_data["access_token"],
            refresh_token=token_data.get("refresh_token"),
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.google_client_id,
            client_secret=settings.google_client_secret,
        )

        # Get user info from Google
        service = build("oauth2", "v2", credentials=credentials)
        user_info = service.userinfo().get().execute()

        email = user_info.get("email")
        name = user_info.get("name")

        # Encrypt tokens before storing
        encrypted_access = encrypt_token(credentials.token)
        encrypted_refresh = encrypt_token(credentials.refresh_token or "")

        user = self.user_service.create_or_update(
            email=email,
            name=name,
            access_token=encrypted_access,
            refresh_token=encrypted_refresh,
            extraction_mode=extraction_mode,
        )

        # Generate simple session token (user_id hash)
        session_token = self._generate_session_token(user.id)
        logger.info(f"OAuth completed for {email}")

        return user, session_token

    def _generate_session_token(self, user_id: int) -> str:
        """Generate session token for user."""
        data = f"{user_id}:{settings.secret_key}"
        return hashlib.sha256(data.encode()).hexdigest()

    def verify_session_token(self, token: str) -> UserSchema | None:
        """Verify session token and return user."""
        users = self.db.query(UserSchema).all()
        for user in users:
            expected = self._generate_session_token(user.id)
            if token == expected:
                return user
        return None

    def logout(self, user_id: int) -> bool:
        """Clear user tokens on logout."""
        return self.user_service.clear_tokens(user_id)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> UserSchema:
    """Dependency to get current authenticated user."""
    token = credentials.credentials
    auth_service = AuthService(db)
    user = auth_service.verify_session_token(token)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    if not user.google_access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not connected to Gmail",
        )

    return user
