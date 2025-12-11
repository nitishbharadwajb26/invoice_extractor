from datetime import datetime
from typing import Literal
from pydantic import BaseModel, EmailStr


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    name: str | None
    extraction_mode: str
    created_at: datetime

    class Config:
        from_attributes = True


class ExtractionModeUpdate(BaseModel):
    mode: Literal["local", "openai"]
