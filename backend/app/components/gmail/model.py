from pydantic import BaseModel


class GmailLabel(BaseModel):
    id: str
    name: str


class SyncRequest(BaseModel):
    label_id: str


class SyncResponse(BaseModel):
    emails_processed: int
    invoices_extracted: int
    errors: list[str] = []
