from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response, JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.components.invoice.model import InvoiceResponse, InvoiceListResponse
from app.components.invoice.service import InvoiceService
from app.components.auth.service import get_current_user
from app.components.user.schema import UserSchema

invoice_router = APIRouter(prefix="/invoices", tags=["Invoices"])


def get_invoice_service(db: Session = Depends(get_db)) -> InvoiceService:
    return InvoiceService(db)


@invoice_router.get("", response_model=InvoiceListResponse)
def list_invoices(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: UserSchema = Depends(get_current_user),
    service: InvoiceService = Depends(get_invoice_service),
):
    """List all invoices for current user."""
    return service.list_invoices(current_user.id, page, limit)


@invoice_router.get("/export")
def export_csv(
    current_user: UserSchema = Depends(get_current_user),
    service: InvoiceService = Depends(get_invoice_service),
):
    """Export all invoices as CSV."""
    csv_data = service.export_csv(current_user.id)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=invoices.csv"},
    )


@invoice_router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: int,
    current_user: UserSchema = Depends(get_current_user),
    service: InvoiceService = Depends(get_invoice_service),
):
    """Get single invoice by ID."""
    invoice = service.get_by_id(invoice_id, current_user.id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return InvoiceResponse.model_validate(invoice)


@invoice_router.delete("/{invoice_id}")
def delete_invoice(
    invoice_id: int,
    current_user: UserSchema = Depends(get_current_user),
    service: InvoiceService = Depends(get_invoice_service),
):
    """Delete an invoice."""
    success = service.delete(invoice_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return JSONResponse(content={"message": "Invoice deleted"})
