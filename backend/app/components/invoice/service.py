import csv
import io
from sqlalchemy.orm import Session
from app.components.invoice.schema import InvoiceSchema
from app.components.invoice.model import InvoiceCreate, InvoiceResponse, InvoiceListResponse
from app.core.logger import get_logger

logger = get_logger(__name__)


class InvoiceService:
    """Invoice CRUD operations service."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, user_id: int, data: InvoiceCreate) -> InvoiceSchema:
        """Create new invoice record."""
        invoice = InvoiceSchema(user_id=user_id, **data.model_dump())
        self.db.add(invoice)
        self.db.commit()
        self.db.refresh(invoice)
        logger.info(f"Created invoice {invoice.id} for user {user_id}")
        return invoice

    def get_by_id(self, invoice_id: int, user_id: int) -> InvoiceSchema | None:
        """Get invoice by ID for specific user."""
        return self.db.query(InvoiceSchema).filter(
            InvoiceSchema.id == invoice_id,
            InvoiceSchema.user_id == user_id
        ).first()

    def get_by_email_id(self, email_id: str, user_id: int, file_name: str = None) -> InvoiceSchema | None:
        """Check if invoice already exists for email (and optionally filename)."""
        query = self.db.query(InvoiceSchema).filter(
            InvoiceSchema.email_id == email_id,
            InvoiceSchema.user_id == user_id
        )
        if file_name:
            query = query.filter(InvoiceSchema.file_name == file_name)
        return query.first()

    def list_invoices(self, user_id: int, page: int = 1, limit: int = 20) -> InvoiceListResponse:
        """List invoices with pagination."""
        offset = (page - 1) * limit
        query = self.db.query(InvoiceSchema).filter(InvoiceSchema.user_id == user_id)

        total = query.count()
        items = query.order_by(InvoiceSchema.created_at.desc()).offset(offset).limit(limit).all()

        return InvoiceListResponse(
            items=[InvoiceResponse.model_validate(i) for i in items],
            total=total,
            page=page,
            limit=limit,
        )

    def delete(self, invoice_id: int, user_id: int) -> bool:
        """Delete invoice."""
        invoice = self.get_by_id(invoice_id, user_id)
        if invoice:
            self.db.delete(invoice)
            self.db.commit()
            logger.info(f"Deleted invoice {invoice_id}")
            return True
        return False

    def export_csv(self, user_id: int) -> str:
        """Export all invoices to CSV string."""
        invoices = self.db.query(InvoiceSchema).filter(
            InvoiceSchema.user_id == user_id
        ).order_by(InvoiceSchema.created_at.desc()).all()

        output = io.StringIO()
        writer = csv.writer(output)

        # Header
        writer.writerow([
            "ID", "Vendor Name", "Invoice Number", "Invoice Date",
            "Total Amount", "Currency", "Due Date", "Email Subject",
            "Email Date", "Extraction Mode", "File Name", "Created At"
        ])

        # Data
        for inv in invoices:
            writer.writerow([
                inv.id,
                inv.vendor_name or "",
                inv.invoice_number or "",
                inv.invoice_date or "",
                inv.total_amount or "",
                inv.currency,
                inv.due_date or "",
                inv.email_subject or "",
                inv.email_date.isoformat() if inv.email_date else "",
                inv.extraction_mode or "",
                inv.file_name or "",
                inv.created_at.isoformat() if inv.created_at else "",
            ])

        return output.getvalue()
