from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.config import get_settings
from app.core.logger import get_logger
from app.components.auth.service import AuthService, get_current_user
from app.components.user.schema import UserSchema

logger = get_logger(__name__)
settings = get_settings()

auth_router = APIRouter(prefix="/auth", tags=["Auth"])


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)


@auth_router.get("/google/url")
def get_google_auth_url(
    extraction_mode: str = Query(default="local"),
    service: AuthService = Depends(get_auth_service),
):
    """Get Google OAuth authorization URL."""
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")

    url = service.get_oauth_url(extraction_mode)
    return {"url": url}


@auth_router.get("/google/callback")
def google_callback(
    code: str = Query(...),
    state: str = Query(default="local"),
    service: AuthService = Depends(get_auth_service),
):
    """Handle Google OAuth callback."""
    try:
        user, session_token = service.handle_callback(code, state)
        redirect_url = f"{settings.frontend_url}/auth/callback?token={session_token}"
        return RedirectResponse(url=redirect_url)
    except Exception as e:
        logger.error(f"OAuth callback error: {e}")
        redirect_url = f"{settings.frontend_url}?error=auth_failed"
        return RedirectResponse(url=redirect_url)


@auth_router.post("/logout")
def logout(
    current_user: UserSchema = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
):
    """Logout and clear tokens."""
    service.logout(current_user.id)
    return JSONResponse(content={"message": "Logged out successfully"})
