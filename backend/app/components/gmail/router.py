from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.components.gmail.model import GmailLabel, SyncRequest, SyncResponse
from app.components.gmail.service import GmailSyncService
from app.components.auth.service import get_current_user
from app.components.user.schema import UserSchema
from app.core.logger import get_logger

logger = get_logger(__name__)
gmail_router = APIRouter(prefix="/gmail", tags=["Gmail"])


def get_gmail_service(
    db: Session = Depends(get_db),
    current_user: UserSchema = Depends(get_current_user),
) -> GmailSyncService:
    return GmailSyncService(db, current_user)


@gmail_router.get("/labels", response_model=list[GmailLabel])
def get_labels(service: GmailSyncService = Depends(get_gmail_service)):
    """Get all Gmail labels for current user."""
    try:
        return service.get_labels()
    except Exception as e:
        logger.error(f"Error fetching labels: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch Gmail labels")


@gmail_router.post("/sync", response_model=SyncResponse)
def sync_emails(
    request: SyncRequest,
    service: GmailSyncService = Depends(get_gmail_service),
):
    """Sync emails from label and extract invoices."""
    try:
        return service.sync_emails(request.label_id)
    except Exception as e:
        logger.error(f"Error syncing emails: {e}")
        raise HTTPException(status_code=500, detail="Failed to sync emails")
