from datetime import datetime
from pydantic import BaseModel


class InvoiceResponse(BaseModel):
    id: int
    email_subject: str | None
    email_date: datetime | None
    vendor_name: str | None
    invoice_number: str | None
    invoice_date: str | None
    total_amount: float | None
    currency: str
    due_date: str | None
    extraction_mode: str | None
    file_name: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class InvoiceListResponse(BaseModel):
    items: list[InvoiceResponse]
    total: int
    page: int
    limit: int


class InvoiceCreate(BaseModel):
    email_id: str
    email_subject: str | None = None
    email_date: datetime | None = None
    vendor_name: str | None = None
    invoice_number: str | None = None
    invoice_date: str | None = None
    total_amount: float | None = None
    currency: str = "USD"
    due_date: str | None = None
    raw_text: str | None = None
    extraction_mode: str | None = None
    file_name: str | None = None
