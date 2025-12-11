from abc import ABC, abstractmethod
from pydantic import BaseModel


class ExtractedInvoice(BaseModel):
    """Extracted invoice data model."""
    vendor_name: str | None = None
    invoice_number: str | None = None
    invoice_date: str | None = None
    total_amount: float | None = None
    currency: str = "USD"
    due_date: str | None = None
    raw_text: str = ""


class PDFExtractor(ABC):
    """Base class for PDF extraction."""

    @abstractmethod
    def extract(self, pdf_content: bytes) -> ExtractedInvoice:
        """Extract invoice data from PDF content."""
        pass
