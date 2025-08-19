"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTrialTimer } from "./useTrialTimer";
import { useAuth } from "../contexts/AuthContext";

export const useTrialAccess = () => {
  const { trialExpired, isInTrial } = useTrialTimer();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is authenticated, allow access
    if (isAuthenticated) return;

    // If trial has expired, redirect to home
    if (trialExpired) {
      router.push("/");
      return;
    }
  }, [trialExpired, isAuthenticated, router]);

  // Return whether access should be blocked
  const isAccessBlocked = !isAuthenticated && trialExpired;

  return {
    isAccessBlocked,
    isInTrial,
    trialExpired,
    isAuthenticated,
  };
};
