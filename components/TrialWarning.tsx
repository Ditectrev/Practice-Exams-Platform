"use client";

import React, { useState } from "react";
import { useTrialTimer } from "../hooks/useTrialTimer";
import { AuthModal } from "./AuthModal";

export const TrialWarning: React.FC = () => {
  const { trialExpired, timeRemaining, formatTimeRemaining, isInTrial } =
    useTrialTimer();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (!isInTrial && !trialExpired) return null;

  return (
    <>
      {isInTrial && (
        <div className="fixed top-4 left-8 md:left-8 md:top-4 left-1/2 top-4 -translate-x-1/2 md:left-8 md:-translate-x-0 bg-amber-600 text-white px-8 py-3 rounded-lg shadow-lg z-40">
          <div className="flex items-center gap-4">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-medium whitespace-nowrap">
              Trial: {formatTimeRemaining()} remaining
            </span>
            <button
              onClick={() => setShowAuthModal(true)}
              className="ml-4 bg-white text-amber-600 px-4 py-2 rounded text-sm font-medium hover:bg-amber-50 transition-colors whitespace-nowrap"
            >
              Sign In
            </button>
          </div>
        </div>
      )}

      {trialExpired && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md text-center">
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Trial Expired
            </h2>
            <p className="text-slate-300 mb-6">
              Your 15-minute trial has ended. Please sign in to continue
              practicing and access all features.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => setShowAuthModal(true)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Sign In Now
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="w-full bg-slate-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-slate-700 transition-colors"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        trialExpired={trialExpired}
      />
    </>
  );
};
