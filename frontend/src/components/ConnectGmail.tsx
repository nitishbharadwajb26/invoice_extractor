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
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h2 className="text-lg font-semibold mb-4">Choose Extraction Mode</h2>

      <div className="space-y-3 mb-6">
        <label className="flex items-start gap-3 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
          <input
            type="radio"
            name="mode"
            value="local"
            checked={mode === "local"}
            onChange={() => setMode("local")}
            className="mt-1"
          />
          <div>
            <div className="font-medium">Local Processing (Privacy)</div>
            <div className="text-sm text-gray-600">
              Data stays on server. Uses pattern matching for extraction.
              Best for privacy-conscious users.
            </div>
          </div>
        </label>

        <label className="flex items-start gap-3 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
          <input
            type="radio"
            name="mode"
            value="openai"
            checked={mode === "openai"}
            onChange={() => setMode("openai")}
            className="mt-1"
          />
          <div>
            <div className="font-medium">OpenAI Processing (Accuracy)</div>
            <div className="text-sm text-gray-600">
              Better extraction accuracy using AI. Invoice data is sent to
              OpenAI for processing.
            </div>
          </div>
        </label>
      </div>

      <Button onClick={handleConnect} loading={loading} className="w-full">
        Connect with Gmail
      </Button>
    </div>
  );
}
