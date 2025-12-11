from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.components.gmail.model import GmailLabel, SyncRequest, SyncResponse
from app.components.gmail.service import GmailSyncService
from app.components.auth.dependencies import validate_access_token
from app.components.auth.auth_utils import TokenData
from app.components.user.schema import UserSchema
from app.core.logger import get_logger

logger = get_logger(__name__)
gmail_router = APIRouter(prefix="/gmail", tags=["Gmail"])


@gmail_router.get("/labels", response_model=list[GmailLabel])
def get_labels(
    token_data: TokenData = Depends(validate_access_token),
    db: Session = Depends(get_db),
):
    """Get all Gmail labels for current user."""
    try:
        user = db.query(UserSchema).filter(UserSchema.id == token_data.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        service = GmailSyncService(db, user)
        return service.get_labels()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching labels: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch Gmail labels")


@gmail_router.post("/sync", response_model=SyncResponse)
def sync_emails(
    request: SyncRequest,
    token_data: TokenData = Depends(validate_access_token),
    db: Session = Depends(get_db),
):
    """Sync emails from label and extract invoices."""
    try:
        user = db.query(UserSchema).filter(UserSchema.id == token_data.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        service = GmailSyncService(db, user)
        return service.sync_emails(request.label_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error syncing emails: {e}")
        raise HTTPException(status_code=500, detail="Failed to sync emails")
