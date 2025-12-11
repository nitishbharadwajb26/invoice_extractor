"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { setToken } from "@/lib/auth";
import { Spinner } from "@/components/ui/Spinner";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      setToken(token);
      router.push("/dashboard");
    } else {
      router.push("/?error=auth_failed");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Spinner size="lg" />
      <p className="mt-4 text-gray-600">Completing authentication...</p>
    </div>
  );
}
