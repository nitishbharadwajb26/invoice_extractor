import re
import io
import pdfplumber
from app.services.pdf_extractor import PDFExtractor, ExtractedInvoice
from app.core.logger import get_logger

logger = get_logger(__name__)


class LocalExtractor(PDFExtractor):
    """Local PDF extraction using pdfplumber and regex patterns."""

    def extract(self, pdf_content: bytes) -> ExtractedInvoice:
        """Extract invoice data from PDF using pattern matching."""
        text = self._extract_text(pdf_content)

        return ExtractedInvoice(
            vendor_name=self._extract_vendor(text),
            invoice_number=self._extract_invoice_number(text),
            invoice_date=self._extract_date(text, "invoice"),
            total_amount=self._extract_amount(text),
            currency=self._extract_currency(text),
            due_date=self._extract_date(text, "due"),
            raw_text=text,
        )

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

    def _extract_vendor(self, text: str) -> str | None:
        """Extract vendor/company name from first lines."""
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        if lines:
            # Usually vendor name is in the first few lines
            for line in lines[:5]:
                # Skip common header words
                if line.lower() not in ["invoice", "tax invoice", "bill"]:
                    if len(line) > 2 and not re.match(r"^[\d\s\-/]+$", line):
                        return line
        return None

    def _extract_invoice_number(self, text: str) -> str | None:
        """Extract invoice number."""
        patterns = [
            r"invoice\s*#?\s*:?\s*([A-Z0-9\-]+)",
            r"inv\s*#?\s*:?\s*([A-Z0-9\-]+)",
            r"invoice\s+number\s*:?\s*([A-Z0-9\-]+)",
            r"invoice\s+no\.?\s*:?\s*([A-Z0-9\-]+)",
            r"#\s*([A-Z0-9\-]{4,})",
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None

    def _extract_date(self, text: str, date_type: str = "invoice") -> str | None:
        """Extract date from text."""
        if date_type == "due":
            patterns = [
                r"due\s+date\s*:?\s*(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})",
                r"due\s*:?\s*(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})",
                r"payment\s+due\s*:?\s*(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})",
            ]
        else:
            patterns = [
                r"invoice\s+date\s*:?\s*(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})",
                r"date\s*:?\s*(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})",
                r"dated?\s*:?\s*(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})",
                r"(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})",
            ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None

    def _extract_amount(self, text: str) -> float | None:
        """Extract total amount."""
        patterns = [
            r"total\s+(?:amount|due)?\s*:?\s*\$?\s*([\d,]+\.?\d*)",
            r"grand\s+total\s*:?\s*\$?\s*([\d,]+\.?\d*)",
            r"amount\s+due\s*:?\s*\$?\s*([\d,]+\.?\d*)",
            r"balance\s+due\s*:?\s*\$?\s*([\d,]+\.?\d*)",
            r"total\s*:?\s*\$?\s*([\d,]+\.?\d*)",
        ]

        amounts = []
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for m in matches:
                try:
                    val = float(m.replace(",", ""))
                    if val > 0:
                        amounts.append(val)
                except:
                    pass

        # Return the largest amount found (likely the total)
        return max(amounts) if amounts else None

    def _extract_currency(self, text: str) -> str:
        """Extract currency code."""
        currencies = {
            r"\$": "USD",
            r"€": "EUR",
            r"£": "GBP",
            r"¥": "JPY",
            r"₹": "INR",
            r"USD": "USD",
            r"EUR": "EUR",
            r"GBP": "GBP",
            r"INR": "INR",
        }
        for pattern, code in currencies.items():
            if re.search(pattern, text):
                return code
        return "USD"
