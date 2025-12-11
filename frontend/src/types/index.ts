export interface User {
  id: number;
  email: string;
  name: string | null;
  extraction_mode: "local" | "openai";
  created_at: string;
}

export interface Label {
  id: string;
  name: string;
}

export interface Invoice {
  id: number;
  email_subject: string | null;
  email_date: string | null;
  vendor_name: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  total_amount: number | null;
  currency: string;
  due_date: string | null;
  extraction_mode: string | null;
  file_name: string | null;
  created_at: string;
}

export interface InvoiceList {
  items: Invoice[];
  total: number;
  page: number;
  limit: number;
}

export interface SyncResult {
  emails_processed: number;
  invoices_extracted: number;
  errors: string[];
}
