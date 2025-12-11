"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConnectGmail } from "@/components/ConnectGmail";
import { isAuthenticated } from "@/lib/auth";
import { getCurrentUser } from "@/lib/api";
import { Spinner } from "@/components/ui/Spinner";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error")) {
      setError("Authentication failed. Please try again.");
    }

    const checkAuth = async () => {
      if (isAuthenticated()) {
        try {
          await getCurrentUser();
          router.push("/dashboard");
          return;
        } catch {
          // Token invalid, continue to show connect
        }
      }
      setChecking(false);
    };

    checkAuth();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gmail Invoice Extractor
        </h1>
        <p className="text-gray-600 max-w-md">
          Extract invoice data from your Gmail attachments automatically.
          Choose your preferred extraction method for privacy or accuracy.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <ConnectGmail />
    </main>
  );
}
