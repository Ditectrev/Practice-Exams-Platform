"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./Button";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  trialExpired?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  trialExpired = false,
}) => {
  const {
    sendEmailOTP,
    verifyOTPAndSignIn,
    signInWithGoogle,
    signInWithApple,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [lastUsedMethod, setLastUsedMethod] = useState<{
    type: string;
    value: string;
  } | null>(null);

  // Load last used method from localStorage
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem("lastUsedAuthMethod");
      if (saved) {
        try {
          setLastUsedMethod(JSON.parse(saved));
        } catch (e) {
          // Invalid JSON, ignore
        }
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setMessage("");

    try {
      const result = await sendEmailOTP(email.trim());
      if (result.success && result.userId) {
        setUserId(result.userId);
        // Save last used method
        const method = { type: "email", value: email.trim() };
        setLastUsedMethod(method);
        localStorage.setItem("lastUsedAuthMethod", JSON.stringify(method));
        setStep("otp");
        setMessage("");
      } else {
        setMessage(result.error || "Failed to send OTP");
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || !userId) return;

    setIsVerifying(true);
    setMessage("");

    try {
      const result = await verifyOTPAndSignIn(userId, otp.trim());
      if (result.success) {
        setIsVerifying(false);
        setIsRedirecting(true);
        setMessage("Redirecting...");
        setTimeout(() => {
          onClose();
          setStep("email");
          setEmail("");
          setOtp("");
          setUserId(null);
          setIsRedirecting(false);
        }, 2000);
      } else {
        setIsVerifying(false);
        setMessage(result.error || "Invalid OTP code");
      }
    } catch (error) {
      setIsVerifying(false);
      setMessage("An error occurred. Please try again.");
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // Save last used method
      const method = { type: "google", value: "Google" };
      setLastUsedMethod(method);
      localStorage.setItem("lastUsedAuthMethod", JSON.stringify(method));
      await signInWithGoogle();
    } catch (error) {
      setMessage("Failed to sign in with Google");
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    // Debug: Store that modal function was called
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(
          "apple_modal_handler_called",
          new Date().toISOString(),
        );
        (window as any).appleModalHandlerCalled = true;
      } catch (e) {
        // Ignore storage errors
      }
    }

    setIsLoading(true);
    try {
      // Save last used method
      const method = { type: "apple", value: "Apple" };
      setLastUsedMethod(method);
      localStorage.setItem("lastUsedAuthMethod", JSON.stringify(method));
      await signInWithApple();
    } catch (error) {
      setMessage("Failed to sign in with Apple");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
        <div className="text-center mb-6">
          {trialExpired ? (
            <>
              <h2 className="text-2xl font-bold text-white mb-2">
                Trial Expired
              </h2>
              <p className="text-slate-300">
                Your 15-minute trial has ended. Please sign in to continue
                practicing.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white mb-2">Sign In</h2>
              <p className="text-slate-300">
                Choose your preferred sign-in method to continue.
              </p>
            </>
          )}
        </div>

        {/* Email OTP Sign In */}
        {step === "email" ? (
          <form onSubmit={handleEmailSignIn} className="mb-6">
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <Button
              type="submit"
              intent="primary"
              size="medium"
              disabled={isLoading}
              className="w-full relative flex items-center justify-center"
            >
              {isLoading && (
                <svg
                  className="animate-spin mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              {isLoading ? "Sending..." : "Continue with Email"}
              {!isLoading && lastUsedMethod?.type === "email" && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  Last Used
                </span>
              )}
            </Button>
          </form>
        ) : (
          <div className="mb-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                Verification
              </h3>
              <p className="text-slate-300 text-sm">
                If you have an account, we have sent a code to{" "}
                <span className="font-medium text-white">
                  {lastUsedMethod?.value}
                </span>
                .
                <br />
                Enter it below.
              </p>
            </div>

            <form onSubmit={handleOTPVerification} className="mb-4">
              <div className="mb-4">
                <div className="flex gap-2 justify-center">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      type="text"
                      value={otp[index] || ""}
                      onChange={(e) => {
                        const newOtp = otp.split("");
                        newOtp[index] = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 1);
                        setOtp(newOtp.join(""));
                        // Auto-focus next input
                        if (e.target.value && index < 5) {
                          const nextInput = document.getElementById(
                            `otp-${index + 1}`,
                          );
                          nextInput?.focus();
                        }
                      }}
                      className="w-12 h-12 text-center text-lg font-mono bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={1}
                      id={`otp-${index}`}
                      required
                    />
                  ))}
                </div>
              </div>

              {(isVerifying || isRedirecting) && (
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center gap-2 text-white">
                    <span>{isVerifying ? "Verifying" : "Redirecting"}</span>
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                intent="primary"
                size="medium"
                disabled={isVerifying || isRedirecting || otp.length !== 6}
                className="w-full"
              >
                {isVerifying
                  ? "Verifying..."
                  : isRedirecting
                  ? "Redirecting..."
                  : "Verify Code"}
              </Button>
            </form>

            <button
              type="button"
              onClick={() => {
                setStep("email");
                setOtp("");
                setUserId(null);
                setMessage("");
                setIsVerifying(false);
                setIsRedirecting(false);
              }}
              className="w-full text-center text-sm text-blue-400 hover:text-blue-300"
            >
              ← Back
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center mb-6">
          <div className="flex-1 border-t border-slate-600"></div>
          <span className="px-4 text-slate-400 text-sm">or</span>
          <div className="flex-1 border-t border-slate-600"></div>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3">
          <Button
            type="button"
            intent="secondary"
            size="medium"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 relative"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
            {!isLoading && lastUsedMethod?.type === "google" && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                Last Used
              </span>
            )}
          </Button>

          <Button
            type="button"
            intent="secondary"
            size="medium"
            onClick={(e) => {
              // Debug: Log that button was clicked
              if (typeof window !== "undefined") {
                try {
                  sessionStorage.setItem(
                    "apple_button_clicked",
                    new Date().toISOString(),
                  );
                  (window as any).appleButtonClicked = true;
                } catch (err) {
                  // Ignore storage errors
                }
              }
              console.log("Apple button clicked!"); // This should work even in production
              handleAppleSignIn();
            }}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 relative"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
              />
            </svg>
            Continue with Apple
            {!isLoading && lastUsedMethod?.type === "apple" && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                Last Used
              </span>
            )}
          </Button>
        </div>

        {/* Message Display */}
        {message && (
          <div className="mt-4 p-3 bg-slate-700 rounded-md">
            <p className="text-slate-200 text-sm">{message}</p>
          </div>
        )}

        {/* Close Button */}
        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};
