"use client";

import { Invoice } from "@/types";
import { Spinner } from "./ui/Spinner";

interface InvoiceTableProps {
  invoices: Invoice[];
  loading: boolean;
  onDelete: (id: number) => void;
}

export function InvoiceTable({ invoices, loading, onDelete }: InvoiceTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No invoices found.</p>
        <p className="text-sm mt-1">Select a label and sync emails to extract invoices.</p>
      </div>
    );
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const formatAmount = (amount: number | null, currency: string) => {
    if (amount === null) return "-";
    return `${currency} ${amount.toFixed(2)}`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="text-left px-4 py-3 font-medium">Vendor</th>
            <th className="text-left px-4 py-3 font-medium">Invoice #</th>
            <th className="text-left px-4 py-3 font-medium">Date</th>
            <th className="text-right px-4 py-3 font-medium">Amount</th>
            <th className="text-left px-4 py-3 font-medium">Due Date</th>
            <th className="text-left px-4 py-3 font-medium">File</th>
            <th className="text-center px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3">{invoice.vendor_name || "-"}</td>
              <td className="px-4 py-3">{invoice.invoice_number || "-"}</td>
              <td className="px-4 py-3">{invoice.invoice_date || formatDate(invoice.email_date)}</td>
              <td className="px-4 py-3 text-right">
                {formatAmount(invoice.total_amount, invoice.currency)}
              </td>
              <td className="px-4 py-3">{invoice.due_date || "-"}</td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {invoice.file_name || "-"}
              </td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => onDelete(invoice.id)}
                  className="text-red-600 hover:text-red-800 p-1"
                  title="Delete"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
