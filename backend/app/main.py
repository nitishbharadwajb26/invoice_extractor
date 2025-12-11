from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.logger import get_logger
from app.database import engine
from app.components.base.schemas import Base
from app.components.user.schema import UserSchema
from app.components.invoice.schema import InvoiceSchema
from app.components.auth.router import auth_router
from app.components.user.router import user_router
from app.components.gmail.router import gmail_router
from app.components.invoice.router import invoice_router

logger = get_logger(__name__)
settings = get_settings()

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Gmail Invoice Extractor",
    description="Extract invoice data from Gmail attachments",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(gmail_router)
app.include_router(invoice_router)


@app.get("/")
def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "Gmail Invoice Extractor API"}


@app.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "healthy"}
