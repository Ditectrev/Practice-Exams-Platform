"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSecureTrial } from "./useSecureTrial";
import { useAuth } from "../contexts/AuthContext";

export const useTrialAccess = () => {
  const { trialExpired, isInTrial, isAccessBlocked, isLoading } =
    useSecureTrial();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If still loading, don't redirect yet
    if (isLoading) return;

    // If user is authenticated, allow access
    if (isAuthenticated) return;

    // If access is blocked (trial expired or blocked), redirect to home
    if (isAccessBlocked) {
      router.push("/");
      return;
    }
  }, [isAccessBlocked, isAuthenticated, router, isLoading]);

  return {
    isAccessBlocked,
    isInTrial,
    trialExpired,
    isAuthenticated,
    isLoading,
  };
};
