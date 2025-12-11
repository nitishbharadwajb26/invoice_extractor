from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.components.user.model import UserResponse, ExtractionModeUpdate
from app.components.user.service import UserService
from app.components.auth.service import get_current_user
from app.components.user.schema import UserSchema

user_router = APIRouter(prefix="/user", tags=["User"])


def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(db)


@user_router.get("/me", response_model=UserResponse)
def get_me(current_user: UserSchema = Depends(get_current_user)):
    """Get current authenticated user."""
    return UserResponse.model_validate(current_user)


@user_router.put("/extraction-mode")
def update_extraction_mode(
    data: ExtractionModeUpdate,
    current_user: UserSchema = Depends(get_current_user),
    service: UserService = Depends(get_user_service)
):
    """Update extraction mode preference."""
    user = service.update_extraction_mode(current_user.id, data.mode)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return JSONResponse(content={"message": "Extraction mode updated", "mode": data.mode})
