import { User, Label, Invoice, InvoiceList, SyncResult } from "@/types";
import { getToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Request failed");
  }

  return response;
}

// Auth
export async function getAuthUrl(extractionMode: string): Promise<string> {
  const response = await fetch(
    `${API_URL}/auth/google/url?extraction_mode=${extractionMode}`
  );
  const data = await response.json();
  return data.url;
}

export async function exchangeAuthCode(code: string): Promise<string> {
  const response = await fetch(`${API_URL}/auth/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Exchange failed" }));
    throw new Error(error.detail || "Failed to exchange auth code");
  }

  const data = await response.json();
  return data.access_token;
}

export async function getCurrentUser(): Promise<User> {
  const response = await fetchWithAuth("/user/me");
  return response.json();
}

export async function logout(): Promise<void> {
  await fetchWithAuth("/auth/logout", { method: "POST" });
}

export async function updateExtractionMode(mode: string): Promise<void> {
  await fetchWithAuth("/user/extraction-mode", {
    method: "PUT",
    body: JSON.stringify({ mode }),
  });
}

// Gmail
export async function getLabels(): Promise<Label[]> {
  const response = await fetchWithAuth("/gmail/labels");
  return response.json();
}

export async function syncEmails(labelId: string): Promise<SyncResult> {
  const response = await fetchWithAuth("/gmail/sync", {
    method: "POST",
    body: JSON.stringify({ label_id: labelId }),
  });
  return response.json();
}

// Invoices
export async function getInvoices(page: number = 1, limit: number = 20): Promise<InvoiceList> {
  const response = await fetchWithAuth(`/invoices?page=${page}&limit=${limit}`);
  return response.json();
}

export async function deleteInvoice(id: number): Promise<void> {
  await fetchWithAuth(`/invoices/${id}`, { method: "DELETE" });
}

export async function exportCsv(): Promise<void> {
  const token = getToken();
  const response = await fetch(`${API_URL}/invoices/export`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Export failed");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "invoices.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
