"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { User, Label, Invoice, SyncResult } from "@/types";
import { isAuthenticated, clearToken } from "@/lib/auth";
import {
  getCurrentUser,
  getLabels,
  syncEmails,
  getInvoices,
  deleteInvoice,
  exportCsv,
  logout,
  updateExtractionMode,
} from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { LabelSelector } from "@/components/LabelSelector";
import { InvoiceTable } from "@/components/InvoiceTable";
import { Pagination } from "@/components/Pagination";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [labels, setLabels] = useState<Label[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showModeModal, setShowModeModal] = useState(false);
  const [newMode, setNewMode] = useState<"local" | "openai">("local");

  const loadInvoices = useCallback(async (pageNum: number = 1) => {
    setInvoicesLoading(true);
    try {
      const data = await getInvoices(pageNum, 20);
      setInvoices(data.items);
      setTotalPages(Math.ceil(data.total / data.limit));
      setPage(pageNum);
    } catch (err) {
      console.error("Failed to load invoices:", err);
    } finally {
      setInvoicesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/");
      return;
    }

    const init = async () => {
      try {
        const [userData, labelsData] = await Promise.all([
          getCurrentUser(),
          getLabels(),
        ]);
        setUser(userData);
        setLabels(labelsData);
        setNewMode(userData.extraction_mode);
        await loadInvoices();
      } catch (err) {
        console.error("Init error:", err);
        clearToken();
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router, loadInvoices]);

  const handleSync = async () => {
    if (!selectedLabel) {
      setError("Please select a label first");
      return;
    }

    setSyncing(true);
    setError(null);
    setSyncResult(null);

    try {
      const result = await syncEmails(selectedLabel);
      setSyncResult(result);
      await loadInvoices(1);
    } catch (err) {
      setError("Failed to sync emails. Please try again.");
      console.error("Sync error:", err);
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this invoice?")) return;

    try {
      await deleteInvoice(id);
      await loadInvoices(page);
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportCsv();
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Continue anyway
    }
    clearToken();
    router.push("/");
  };

  const handleModeChange = async () => {
    try {
      await updateExtractionMode(newMode);
      setUser((prev) => (prev ? { ...prev, extraction_mode: newMode } : null));
      setShowModeModal(false);
    } catch (err) {
      console.error("Mode change error:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">
            Gmail Invoice Extractor
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <Button variant="secondary" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Mode & Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Mode:</span>
              <span className="font-medium">
                {user?.extraction_mode === "openai" ? "OpenAI" : "Local"} Processing
              </span>
              <button
                onClick={() => setShowModeModal(true)}
                className="text-blue-600 text-sm hover:underline"
              >
                Change
              </button>
            </div>

            <div className="flex-1" />

            <LabelSelector
              labels={labels}
              selectedLabel={selectedLabel}
              onSelect={setSelectedLabel}
            />

            <Button onClick={handleSync} loading={syncing} disabled={!selectedLabel}>
              Sync Emails
            </Button>

            <Button
              variant="secondary"
              onClick={handleExport}
              loading={exporting}
              disabled={invoices.length === 0}
            >
              Export CSV
            </Button>
          </div>

          {/* Sync Result */}
          {syncResult && (
            <div className="mt-4 p-3 bg-green-50 text-green-800 rounded-md">
              Processed {syncResult.emails_processed} emails, extracted{" "}
              {syncResult.invoices_extracted} invoices.
              {syncResult.errors.length > 0 && (
                <span className="text-orange-600 ml-2">
                  ({syncResult.errors.length} errors)
                </span>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}
        </div>

        {/* Invoice Table */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <InvoiceTable
            invoices={invoices}
            loading={invoicesLoading}
            onDelete={handleDelete}
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={loadInvoices}
          />
        </div>
      </main>

      {/* Mode Change Modal */}
      {showModeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Change Extraction Mode</h3>

            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="newMode"
                  checked={newMode === "local"}
                  onChange={() => setNewMode("local")}
                />
                <span>Local Processing (Privacy)</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="newMode"
                  checked={newMode === "openai"}
                  onChange={() => setNewMode("openai")}
                />
                <span>OpenAI Processing (Accuracy)</span>
              </label>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleModeChange} className="flex-1">
                Save
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowModeModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
