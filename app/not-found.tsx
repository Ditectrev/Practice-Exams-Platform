"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col items-center justify-center">
      {/* Header */}
      <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-4">
        Page Not Found
      </h1>

      {/* Description */}
      <p className="zoom-area text-[var(--color-text-secondary)] text-lg mb-8 max-w-md text-center">
        Oops! The page you&apos;re looking for seems to have drifted off into
        space. Don&apos;t worry, our{" "}
        <b className="text-[var(--color-primary)]">practice exams</b> are still
        here waiting for you!
      </p>

      {/* 404 Numbers */}
      <section className="error-container">
        <span className="four">
          <span className="screen-reader-text">4</span>
        </span>
        <span className="zero">
          <span className="screen-reader-text">0</span>
        </span>
        <span className="four">
          <span className="screen-reader-text">4</span>
        </span>
      </section>

      {/* Action buttons */}
      <div className="link-container">
        <Link href="/" className="more-link">
          📚 Browse Exams
        </Link>
      </div>
    </div>
  );
}
