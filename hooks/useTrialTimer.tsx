"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

const TRIAL_DURATION_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

export const useTrialTimer = () => {
  const { isAuthenticated } = useAuth();
  const [trialStartTime, setTrialStartTime] = useState<number | null>(null);
  const [trialExpired, setTrialExpired] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(TRIAL_DURATION_MS);

  useEffect(() => {
    // If user is authenticated, reset trial
    if (isAuthenticated) {
      setTrialStartTime(null);
      setTrialExpired(false);
      setTimeRemaining(TRIAL_DURATION_MS);
      return;
    }

    // Start trial timer for unauthenticated users
    if (!trialStartTime) {
      const startTime = Date.now();
      setTrialStartTime(startTime);
      localStorage.setItem("trialStartTime", startTime.toString());
    }

    // Check if trial has expired
    if (trialStartTime) {
      const elapsed = Date.now() - trialStartTime;
      if (elapsed >= TRIAL_DURATION_MS) {
        setTrialExpired(true);
        setTimeRemaining(0);
        return;
      }

      // Update remaining time
      const remaining = TRIAL_DURATION_MS - elapsed;
      setTimeRemaining(remaining);
    }
  }, [isAuthenticated, trialStartTime]);

  useEffect(() => {
    // Restore trial start time from localStorage
    const savedStartTime = localStorage.getItem("trialStartTime");
    if (savedStartTime && !isAuthenticated) {
      const startTime = parseInt(savedStartTime);
      const elapsed = Date.now() - startTime;

      if (elapsed >= TRIAL_DURATION_MS) {
        setTrialExpired(true);
        setTimeRemaining(0);
      } else {
        setTrialStartTime(startTime);
        setTimeRemaining(TRIAL_DURATION_MS - elapsed);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (trialExpired || isAuthenticated) return;

    const interval = setInterval(() => {
      if (trialStartTime) {
        const elapsed = Date.now() - trialStartTime;
        const remaining = TRIAL_DURATION_MS - elapsed;

        if (remaining <= 0) {
          setTrialExpired(true);
          setTimeRemaining(0);
        } else {
          setTimeRemaining(remaining);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [trialStartTime, trialExpired, isAuthenticated]);

  const formatTimeRemaining = () => {
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const resetTrial = () => {
    setTrialStartTime(null);
    setTrialExpired(false);
    setTimeRemaining(TRIAL_DURATION_MS);
    localStorage.removeItem("trialStartTime");
  };

  return {
    trialExpired,
    timeRemaining,
    formatTimeRemaining,
    resetTrial,
    isInTrial: !isAuthenticated && !trialExpired && trialStartTime !== null,
  };
};
