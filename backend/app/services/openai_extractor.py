import io
import json
import pdfplumber
from openai import OpenAI
from app.services.pdf_extractor import PDFExtractor, ExtractedInvoice
from app.core.logger import get_logger

logger = get_logger(__name__)

EXTRACTION_PROMPT = """Extract the following information from this invoice text.
Return a JSON object with these fields:
- vendor_name: The company/vendor name who issued the invoice
- invoice_number: The invoice number/ID
- invoice_date: The invoice date (format: MM/DD/YYYY or as shown)
- total_amount: The total amount as a number (no currency symbol)
- currency: The currency code (USD, EUR, GBP, etc.)
- due_date: The payment due date if mentioned

If a field cannot be found, use null.

Invoice text:
{text}

Return ONLY valid JSON, no other text."""


class OpenAIExtractor(PDFExtractor):
    """OpenAI-powered PDF extraction for better accuracy."""

    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)

    def extract(self, pdf_content: bytes) -> ExtractedInvoice:
        """Extract invoice data using OpenAI."""
        text = self._extract_text(pdf_content)

        if not text.strip():
            return ExtractedInvoice(raw_text="")

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are an invoice data extraction assistant. Extract structured data from invoice text."},
                    {"role": "user", "content": EXTRACTION_PROMPT.format(text=text[:4000])},
                ],
                temperature=0,
                max_tokens=500,
            )

            result_text = response.choices[0].message.content.strip()

            # Parse JSON response
            if result_text.startswith("```"):
                result_text = result_text.split("```")[1]
                if result_text.startswith("json"):
                    result_text = result_text[4:]

            data = json.loads(result_text)

            return ExtractedInvoice(
                vendor_name=data.get("vendor_name"),
                invoice_number=data.get("invoice_number"),
                invoice_date=data.get("invoice_date"),
                total_amount=self._parse_amount(data.get("total_amount")),
                currency=data.get("currency", "USD") or "USD",
                due_date=data.get("due_date"),
                raw_text=text,
            )

        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}")
            return ExtractedInvoice(raw_text=text)
        except Exception as e:
            logger.error(f"OpenAI extraction error: {e}")
            return ExtractedInvoice(raw_text=text)

    def _extract_text(self, pdf_content: bytes) -> str:
        """Extract text from PDF."""
        text = ""
        try:
            with pdfplumber.open(io.BytesIO(pdf_content)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            logger.error(f"PDF text extraction error: {e}")
        return text

    def _parse_amount(self, value) -> float | None:
        """Parse amount from various formats."""
        if value is None:
            return None
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str):
            try:
                cleaned = value.replace(",", "").replace("$", "").replace("€", "").replace("£", "").strip()
                return float(cleaned)
            except:
                return None
        return None
