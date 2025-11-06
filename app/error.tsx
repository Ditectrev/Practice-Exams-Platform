"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col items-center justify-center px-4">
      {/* Header */}
      <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-4">
        Something went wrong!
      </h1>

      {/* Description */}
      <p className="zoom-area text-[var(--color-text-secondary)] text-lg mb-8 max-w-md text-center">
        We&apos;re sorry, but something unexpected happened. Don&apos;t worry,
        our <b className="text-[var(--color-primary)]">practice exams</b> are
        still here waiting for you!
      </p>

      {/* Error Details (only in development) */}
      {process.env.NODE_ENV === "development" && error.message && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg max-w-md w-full">
          <p className="text-sm text-red-800 dark:text-red-200 font-mono break-all">
            {error.message}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <button
          onClick={reset}
          className="px-6 py-3 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:opacity-90 transition-opacity font-medium"
        >
          📚 Go to Home
        </Link>
      </div>

      {/* Help text */}
      <p className="mt-8 text-sm text-[var(--color-text-secondary)] text-center max-w-md">
        If this problem persists, please{" "}
        <a
          href="https://github.com/Ditectrev/Practice-Exams-Platform/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--color-primary)] hover:underline"
        >
          report it on GitHub
        </a>
        .
      </p>
    </div>
  );
}
