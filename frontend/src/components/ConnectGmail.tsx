"use client";

import { useState } from "react";
import { Button } from "./ui/Button";
import { getAuthUrl } from "@/lib/api";

export function ConnectGmail() {
  const [mode, setMode] = useState<"local" | "openai">("local");
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const url = await getAuthUrl(mode);
      window.location.href = url;
    } catch (error) {
      console.error("Failed to get auth URL:", error);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Get Started</h2>
        <p className="text-gray-500 text-sm mt-1">Choose how to process your invoices</p>
      </div>

      <div className="space-y-3 mb-6">
        <label
          className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
            mode === "local"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <input
            type="radio"
            name="mode"
            value="local"
            checked={mode === "local"}
            onChange={() => setMode("local")}
            className="mt-1 accent-blue-600"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">Local Processing</span>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                Privacy
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Data stays on server. Uses pattern matching. Best for sensitive data.
            </p>
          </div>
        </label>

        <label
          className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
            mode === "openai"
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <input
            type="radio"
            name="mode"
            value="openai"
            checked={mode === "openai"}
            onChange={() => setMode("openai")}
            className="mt-1 accent-blue-600"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">AI Processing</span>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                Accuracy
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Uses OpenAI for better extraction. Great for complex invoices.
            </p>
          </div>
        </label>
      </div>

      <Button onClick={handleConnect} loading={loading} className="w-full py-3 text-base">
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Connect with Gmail
      </Button>
    </div>
  );
}
