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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left Content */}
          <div className="flex-1 text-center lg:text-left">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50">
              <div className="inline-block px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
                Automate Your Invoice Management
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Gmail Invoice
                <span className="text-blue-600"> Extractor</span>
              </h1>

              <p className="text-xl text-gray-600 mb-8">
                Stop manually tracking invoices. Let AI extract and organize your
                invoice data from Gmail attachments automatically.
              </p>

              {/* Features */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">Auto-Extract PDFs</span>
                </div>
                <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-full">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">Privacy Options</span>
                </div>
                <div className="flex items-center gap-2 bg-orange-50 text-orange-700 px-4 py-2 rounded-full">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">CSV Export</span>
                </div>
              </div>

              {/* Quote */}
              <div className="border-t border-gray-200 pt-4">
                <p className="text-gray-500 italic">
                  "Track every satisfying penny of yours."
                </p>
              </div>
            </div>
          </div>

          {/* Right Content - Connect Card */}
          <div className="flex-1 w-full max-w-md">
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-center">
                {error}
              </div>
            )}
            <ConnectGmail />

            {/* Trust Badge */}
            <div className="mt-6 text-center">
              <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Your data is secure. We never store your emails.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">100%</div>
            <div className="text-gray-600 text-sm">Privacy Focused</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">2</div>
            <div className="text-gray-600 text-sm">Extraction Modes</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">PDF</div>
            <div className="text-gray-600 text-sm">Auto Processing</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">CSV</div>
            <div className="text-gray-600 text-sm">Easy Export</div>
          </div>
        </div>
      </div>
    </main>
  );
}
