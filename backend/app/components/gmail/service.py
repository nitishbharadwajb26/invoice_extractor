import base64
from datetime import datetime
from email.utils import parsedate_to_datetime
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import decrypt_token
from app.core.logger import get_logger
from app.components.user.schema import UserSchema
from app.components.invoice.service import InvoiceService
from app.components.invoice.model import InvoiceCreate
from app.components.gmail.model import GmailLabel, SyncResponse
from app.services.local_extractor import LocalExtractor
from app.services.openai_extractor import OpenAIExtractor

logger = get_logger(__name__)
settings = get_settings()


class GmailSyncService:
    """Gmail sync operations service."""

    def __init__(self, db: Session, user: UserSchema):
        self.db = db
        self.user = user
        self.invoice_service = InvoiceService(db)
        self.gmail_service = self._build_gmail_service()

    def _build_gmail_service(self):
        """Build Gmail API service with user credentials."""
        access_token = decrypt_token(self.user.google_access_token)
        refresh_token = decrypt_token(self.user.google_refresh_token) if self.user.google_refresh_token else None

        credentials = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.google_client_id,
            client_secret=settings.google_client_secret,
        )
        return build("gmail", "v1", credentials=credentials)

    def get_labels(self) -> list[GmailLabel]:
        """Fetch all Gmail labels."""
        try:
            results = self.gmail_service.users().labels().list(userId="me").execute()
            labels = results.get("labels", [])
            return [GmailLabel(id=l["id"], name=l["name"]) for l in labels]
        except Exception as e:
            logger.error(f"Error fetching labels: {e}")
            raise

    def sync_emails(self, label_id: str) -> SyncResponse:
        """Sync emails from label and extract invoice data."""
        emails_processed = 0
        invoices_extracted = 0
        errors = []

        # Get extractor based on user preference
        if self.user.extraction_mode == "openai" and settings.openai_api_key:
            extractor = OpenAIExtractor(settings.openai_api_key)
        else:
            extractor = LocalExtractor()

        try:
            # Fetch message IDs with label
            results = self.gmail_service.users().messages().list(
                userId="me", labelIds=[label_id], maxResults=50
            ).execute()
            messages = results.get("messages", [])

            for msg_info in messages:
                msg_id = msg_info["id"]

                # Skip if already processed
                existing = self.invoice_service.get_by_email_id(msg_id, self.user.id)
                if existing:
                    continue

                try:
                    # Fetch full message
                    message = self.gmail_service.users().messages().get(
                        userId="me", id=msg_id, format="full"
                    ).execute()

                    emails_processed += 1

                    # Extract email metadata
                    headers = message.get("payload", {}).get("headers", [])
                    subject = next((h["value"] for h in headers if h["name"].lower() == "subject"), "")
                    date_str = next((h["value"] for h in headers if h["name"].lower() == "date"), "")

                    email_date = None
                    if date_str:
                        try:
                            email_date = parsedate_to_datetime(date_str)
                        except:
                            pass

                    # Find PDF attachments
                    attachments = self._get_pdf_attachments(message)

                    for filename, pdf_content in attachments:
                        try:
                            extracted = extractor.extract(pdf_content)

                            invoice_data = InvoiceCreate(
                                email_id=msg_id,
                                email_subject=subject,
                                email_date=email_date,
                                vendor_name=extracted.vendor_name,
                                invoice_number=extracted.invoice_number,
                                invoice_date=extracted.invoice_date,
                                total_amount=extracted.total_amount,
                                currency=extracted.currency,
                                due_date=extracted.due_date,
                                raw_text=extracted.raw_text[:2000] if extracted.raw_text else None,
                                extraction_mode=self.user.extraction_mode,
                                file_name=filename,
                            )

                            self.invoice_service.create(self.user.id, invoice_data)
                            invoices_extracted += 1
                            logger.info(f"Extracted invoice from {filename}")

                        except Exception as e:
                            errors.append(f"Error extracting {filename}: {str(e)}")
                            logger.error(f"Extraction error: {e}")

                except Exception as e:
                    errors.append(f"Error processing message {msg_id}: {str(e)}")
                    logger.error(f"Message processing error: {e}")

        except Exception as e:
            errors.append(f"Error syncing emails: {str(e)}")
            logger.error(f"Sync error: {e}")

        return SyncResponse(
            emails_processed=emails_processed,
            invoices_extracted=invoices_extracted,
            errors=errors[:10],  # Limit errors returned
        )

    def _get_pdf_attachments(self, message: dict) -> list[tuple[str, bytes]]:
        """Extract PDF attachments from email message."""
        attachments = []
        payload = message.get("payload", {})

        def process_parts(parts):
            for part in parts:
                filename = part.get("filename", "")
                mime_type = part.get("mimeType", "")

                if filename.lower().endswith(".pdf") or mime_type == "application/pdf":
                    body = part.get("body", {})
                    attachment_id = body.get("attachmentId")

                    if attachment_id:
                        att = self.gmail_service.users().messages().attachments().get(
                            userId="me", messageId=message["id"], id=attachment_id
                        ).execute()
                        data = att.get("data", "")
                        content = base64.urlsafe_b64decode(data)
                        attachments.append((filename or "attachment.pdf", content))

                # Recurse into nested parts
                if "parts" in part:
                    process_parts(part["parts"])

        if "parts" in payload:
            process_parts(payload["parts"])

        return attachments
