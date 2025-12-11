"use client";

import { Invoice } from "@/types";

interface SpendingSummaryProps {
  invoices: Invoice[];
}

interface CurrencyTotal {
  currency: string;
  total: number;
  count: number;
}

export function SpendingSummary({ invoices }: SpendingSummaryProps) {
  // Calculate totals by currency
  const currencyTotals = invoices.reduce<Record<string, CurrencyTotal>>((acc, inv) => {
    const currency = inv.currency || "USD";
    const amount = inv.total_amount || 0;

    if (!acc[currency]) {
      acc[currency] = { currency, total: 0, count: 0 };
    }
    acc[currency].total += amount;
    acc[currency].count += 1;
    return acc;
  }, {});

  const totals = Object.values(currencyTotals).sort((a, b) => b.total - a.total);
  const totalInvoices = invoices.length;

  const formatAmount = (amount: number, currency: string) => {
    const symbols: Record<string, string> = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      INR: "₹",
      JPY: "¥",
    };
    const symbol = symbols[currency] || currency + " ";
    return `${symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getColorClass = (index: number) => {
    const colors = [
      "from-blue-500 to-blue-600",
      "from-green-500 to-green-600",
      "from-purple-500 to-purple-600",
      "from-orange-500 to-orange-600",
      "from-pink-500 to-pink-600",
    ];
    return colors[index % colors.length];
  };

  if (totalInvoices === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending Overview</h3>
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>No spending data yet</p>
          <p className="text-sm">Sync your invoices to see the summary</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Spending Overview</h3>
        <span className="text-sm text-gray-500">{totalInvoices} invoice{totalInvoices !== 1 ? "s" : ""}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {totals.map((item, index) => (
          <div
            key={item.currency}
            className={`bg-gradient-to-r ${getColorClass(index)} rounded-xl p-4 text-white`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80 text-sm font-medium">{item.currency}</span>
              <span className="bg-white/20 px-2 py-0.5 rounded text-xs">
                {item.count} invoice{item.count !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="text-2xl font-bold">
              {formatAmount(item.total, item.currency)}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-gray-900">{totalInvoices}</div>
          <div className="text-xs text-gray-500">Total Invoices</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{totals.length}</div>
          <div className="text-xs text-gray-500">Currencies</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">
            {invoices.filter(i => i.vendor_name).length}
          </div>
          <div className="text-xs text-gray-500">Vendors</div>
        </div>
      </div>
    </div>
  );
}
