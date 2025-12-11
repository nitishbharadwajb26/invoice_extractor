"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setToken } from "@/lib/auth";
import { exchangeAuthCode } from "@/lib/api";
import { Spinner } from "@/components/ui/Spinner";

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (!code) {
        router.push("/?error=auth_failed");
        return;
      }

      try {
        // Exchange temporary code for access token (secure way)
        const accessToken = await exchangeAuthCode(code);
        setToken(accessToken);
        router.push("/dashboard");
      } catch (err) {
        console.error("Auth exchange failed:", err);
        setError("Authentication failed. Please try again.");
        setTimeout(() => router.push("/?error=auth_failed"), 2000);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      {error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <>
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Completing authentication...</p>
        </>
      )}
    </div>
  );
}
