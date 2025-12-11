from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response, JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.components.invoice.model import InvoiceResponse, InvoiceListResponse
from app.components.invoice.service import InvoiceService
from app.components.auth.dependencies import validate_access_token
from app.components.auth.auth_utils import TokenData

invoice_router = APIRouter(prefix="/invoices", tags=["Invoices"])


def get_invoice_service(db: Session = Depends(get_db)) -> InvoiceService:
    return InvoiceService(db)


@invoice_router.get("", response_model=InvoiceListResponse)
def list_invoices(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=1000),
    token_data: TokenData = Depends(validate_access_token),
    service: InvoiceService = Depends(get_invoice_service),
):
    """List all invoices for current user."""
    return service.list_invoices(token_data.user_id, page, limit)


@invoice_router.get("/export")
def export_csv(
    token_data: TokenData = Depends(validate_access_token),
    service: InvoiceService = Depends(get_invoice_service),
):
    """Export all invoices as CSV."""
    csv_data = service.export_csv(token_data.user_id)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=invoices.csv"},
    )


@invoice_router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: int,
    token_data: TokenData = Depends(validate_access_token),
    service: InvoiceService = Depends(get_invoice_service),
):
    """Get single invoice by ID."""
    invoice = service.get_by_id(invoice_id, token_data.user_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return InvoiceResponse.model_validate(invoice)


@invoice_router.delete("/{invoice_id}")
def delete_invoice(
    invoice_id: int,
    token_data: TokenData = Depends(validate_access_token),
    service: InvoiceService = Depends(get_invoice_service),
):
    """Delete an invoice."""
    success = service.delete(invoice_id, token_data.user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return JSONResponse(content={"message": "Invoice deleted"})
