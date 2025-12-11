from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.components.base.schemas import Base


class InvoiceSchema(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    email_id = Column(String, nullable=False, index=True)
    email_subject = Column(String, nullable=True)
    email_date = Column(DateTime, nullable=True)
    vendor_name = Column(String, nullable=True)
    invoice_number = Column(String, nullable=True)
    invoice_date = Column(String, nullable=True)
    total_amount = Column(Float, nullable=True)
    currency = Column(String, default="USD")
    due_date = Column(String, nullable=True)
    raw_text = Column(Text, nullable=True)
    extraction_mode = Column(String, nullable=True)
    file_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("UserSchema", back_populates="invoices")
