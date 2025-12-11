from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.components.user.model import UserResponse, ExtractionModeUpdate
from app.components.user.service import UserService
from app.components.auth.dependencies import validate_access_token
from app.components.auth.auth_utils import TokenData

user_router = APIRouter(prefix="/user", tags=["User"])


def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(db)


@user_router.get("/me", response_model=UserResponse)
def get_me(
    token_data: TokenData = Depends(validate_access_token),
    service: UserService = Depends(get_user_service)
):
    """Get current authenticated user."""
    user = service.get_by_id(token_data.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse.model_validate(user)


@user_router.put("/extraction-mode")
def update_extraction_mode(
    data: ExtractionModeUpdate,
    token_data: TokenData = Depends(validate_access_token),
    service: UserService = Depends(get_user_service)
):
    """Update extraction mode preference."""
    user = service.update_extraction_mode(token_data.user_id, data.mode)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return JSONResponse(content={"message": "Extraction mode updated", "mode": data.mode})
