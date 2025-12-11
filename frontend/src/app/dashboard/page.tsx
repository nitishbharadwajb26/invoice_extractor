"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
import { Toast, ToastType } from "@/components/ui/Toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { LabelSelector } from "@/components/LabelSelector";
import { InvoiceTable } from "@/components/InvoiceTable";
import { Pagination } from "@/components/Pagination";
import { SpendingSummary } from "@/components/SpendingSummary";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [labels, setLabels] = useState<Label[]>([]);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showModeModal, setShowModeModal] = useState(false);
  const [newMode, setNewMode] = useState<"local" | "openai">("local");

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; invoiceId: number | null }>({
    isOpen: false,
    invoiceId: null,
  });
  const [deleting, setDeleting] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const PAGE_SIZE = 20;

  const loadInvoices = useCallback(async () => {
    setInvoicesLoading(true);
    try {
      const data = await getInvoices(1, 300);
      setAllInvoices(data.items);
      setTotalCount(data.total);
      setTotalPages(Math.ceil(data.total / PAGE_SIZE));
    } catch (err) {
      console.error("Failed to load invoices:", err);
    } finally {
      setInvoicesLoading(false);
    }
  }, []);

  // Derive current page invoices from allInvoices
  const invoices = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return allInvoices.slice(start, start + PAGE_SIZE);
  }, [allInvoices, page]);

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
      setPage(1);
      await loadInvoices();
    } catch (err) {
      setError("Failed to sync emails. Please try again.");
      console.error("Sync error:", err);
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeleteModal({ isOpen: true, invoiceId: id });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.invoiceId) return;

    setDeleting(true);
    try {
      await deleteInvoice(deleteModal.invoiceId);
      await loadInvoices();
      setToast({ message: "Invoice deleted successfully", type: "success" });
    } catch (err) {
      console.error("Delete error:", err);
      setToast({ message: "Failed to delete invoice", type: "error" });
    } finally {
      setDeleting(false);
      setDeleteModal({ isOpen: false, invoiceId: null });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, invoiceId: null });
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Invoice Dashboard</h1>
              <p className="text-xs text-gray-500">Manage your extracted invoices</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-gray-900">{user?.name || user?.email}</div>
              <div className="text-xs text-gray-500">
                {user?.extraction_mode === "openai" ? "AI Mode" : "Local Mode"}
              </div>
            </div>
            <Button variant="secondary" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Spending Summary */}
        <div className="mb-6">
          <SpendingSummary invoices={allInvoices} />
        </div>

        {/* Controls Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
              <span className="text-sm text-gray-600">Mode:</span>
              <span className="font-medium text-gray-900">
                {user?.extraction_mode === "openai" ? "OpenAI" : "Local"}
              </span>
              <button
                onClick={() => setShowModeModal(true)}
                className="text-blue-600 text-sm hover:underline ml-1"
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
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sync Emails
            </Button>

            <Button
              variant="secondary"
              onClick={handleExport}
              loading={exporting}
              disabled={invoices.length === 0}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </Button>
          </div>

          {/* Sync Result */}
          {syncResult && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center gap-3">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                Processed {syncResult.emails_processed} emails, extracted{" "}
                <strong>{syncResult.invoices_extracted}</strong> invoices.
                {syncResult.errors.length > 0 && (
                  <span className="text-orange-600 ml-2">
                    ({syncResult.errors.length} errors)
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Invoice Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Invoices</h2>
            {totalCount > 0 && (
              <span className="text-sm text-gray-500">{totalCount} total</span>
            )}
          </div>
          <InvoiceTable
            invoices={invoices}
            loading={invoicesLoading}
            onDelete={handleDeleteClick}
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </main>

      {/* Mode Change Modal */}
      {showModeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Change Extraction Mode</h3>

            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="newMode"
                  checked={newMode === "local"}
                  onChange={() => setNewMode("local")}
                  className="accent-blue-600"
                />
                <div>
                  <span className="font-medium">Local Processing</span>
                  <p className="text-sm text-gray-500">Privacy focused</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="newMode"
                  checked={newMode === "openai"}
                  onChange={() => setNewMode("openai")}
                  className="accent-blue-600"
                />
                <div>
                  <span className="font-medium">OpenAI Processing</span>
                  <p className="text-sm text-gray-500">Better accuracy</p>
                </div>
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Invoice"
        message="Are you sure you want to delete this invoice? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        loading={deleting}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
