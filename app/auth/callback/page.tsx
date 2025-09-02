"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthService } from "../../../lib/appwrite/auth";
import LoadingIndicator from "../../../components/LoadingIndicator";
import { useAuth } from "../../../contexts/AuthContext";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if this is an OAuth callback
        const userId = searchParams.get("userId");
        const secret = searchParams.get("secret");
        const success = searchParams.get("success");
        const failure = searchParams.get("failure");

        if (failure) {
          setStatus("error");
          setMessage("Authentication failed. Please try again.");
          setTimeout(() => router.push("/"), 3000);
          return;
        }

        if (success === "true") {
          // Refresh auth context to update authentication state
          await refreshUser();
          setStatus("success");
          setMessage("Authentication successful! Redirecting...");
          setTimeout(() => router.push("/"), 2000);
          return;
        }

        // Handle magic link callback
        if (userId && secret) {
          const result = await AuthService.updateEmailSession(userId, secret);
          if (result.success) {
            // Refresh auth context to update authentication state
            await refreshUser();
            setStatus("success");
            setMessage("Email verified successfully! Redirecting...");
            setTimeout(() => router.push("/"), 2000);
          } else {
            setStatus("error");
            setMessage(result.error?.message || "Verification failed");
            setTimeout(() => router.push("/"), 3000);
          }
          return;
        }

        // If no callback parameters, redirect to home
        router.push("/");
      } catch (error) {
        setStatus("error");
        setMessage("An error occurred during authentication");
        setTimeout(() => router.push("/"), 3000);
      }
    };

    handleCallback();
  }, [router, searchParams, refreshUser]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingIndicator />
          <p className="text-white mt-4">Processing authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        {status === "success" ? (
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        ) : (
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        )}

        <h2 className="text-2xl font-bold text-white mb-2">
          {status === "success" ? "Success!" : "Error"}
        </h2>
        <p className="text-slate-300 mb-4">{message}</p>

        <button
          onClick={() => router.push("/")}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}
