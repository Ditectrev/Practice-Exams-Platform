"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { databases } from "../lib/appwrite/config";
import { Query } from "appwrite";

const TRIAL_DURATION_MS = 15 * 60 * 1000; // 15 minutes in milliseconds
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "";
const TRIAL_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID || "";

// Environment variables loaded

interface TrialRecord {
  $id: string;
  session_id: string;
  ip_address: string;
  user_agent: string;
  start_time: number;
  end_time: number;
  is_active: boolean;
  device_fingerprint: string;
}

export const useSecureTrial = () => {
  const { isAuthenticated } = useAuth();
  const [trialStartTime, setTrialStartTime] = useState<number | null>(null);
  const [trialExpired, setTrialExpired] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(TRIAL_DURATION_MS);
  const [isLoading, setIsLoading] = useState(true);
  const [trialBlocked, setTrialBlocked] = useState(false);

  // Generate a simple device fingerprint
  const getDeviceFingerprint = (): string => {
    if (typeof window === "undefined") return "";

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx?.fillText("Device fingerprint", 10, 10);
    const fingerprint = canvas.toDataURL();

    const screenInfo = `${screen.width}x${screen.height}x${screen.colorDepth}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Create a shorter hash instead of base64 encoding
    const data = `${fingerprint}-${screenInfo}-${timezone}-${navigator.language}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return `fp_${Math.abs(hash).toString(36)}`;
  };

  // Get user's IP address for additional security
  const getUserIP = async (): Promise<string> => {
    // Try multiple IP services for better reliability
    const ipServices = [
      "https://api.ipify.org?format=json",
      "https://ipapi.co/json/",
      "https://api.ip.sb/geoip",
      "https://httpbin.org/ip",
    ];

    for (const service of ipServices) {
      try {
        const response = await fetch(service, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          // Add timeout
          signal: AbortSignal.timeout(3000),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        let ip = data.ip || data.query || data.origin;

        if (ip && typeof ip === "string" && ip.match(/^\d+\.\d+\.\d+\.\d+$/)) {
          return ip;
        }
      } catch (error: unknown) {
        // Silently continue to next service
        continue;
      }
    }

    // If all IP services fail, use a fallback
    let fallbackId = localStorage.getItem("ip_fallback_id");
    if (!fallbackId) {
      // Use browser fingerprint + timestamp for uniqueness
      const browserInfo = `${navigator.userAgent}-${navigator.language}-${screen.width}x${screen.height}`;
      const hash = browserInfo.split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0);
      fallbackId = `fallback_${Math.abs(hash).toString(
        36,
      )}_${Date.now().toString(36)}`;
      localStorage.setItem("ip_fallback_id", fallbackId);
    }

    return fallbackId;
  };

  // Get user's session identifier (for trial tracking)
  const getSessionId = async (): Promise<string> => {
    // Generate or retrieve a persistent session ID for trial tracking
    let sessionId = localStorage.getItem("trial_session_id");
    if (!sessionId) {
      sessionId =
        Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem("trial_session_id", sessionId);
    }
    return sessionId;
  };

  // Check if device has ever used a trial (additional security layer)
  const hasUsedTrialBefore = (): boolean => {
    try {
      // Check multiple storage mechanisms for trial usage evidence
      const localTrialId = localStorage.getItem("currentTrialId");
      // NOTE: Don't check trial_session_id here - it gets created for new users too!
      const fallbackId = localStorage.getItem("ip_fallback_id");
      const trialEverUsed = localStorage.getItem("trial_ever_used");

      // Also check sessionStorage (survives page refresh but not tab close)
      const sessionTrialUsed = sessionStorage.getItem("trial_ever_used");

      // If any evidence of previous trial exists, consider it used
      return !!(
        localTrialId ||
        fallbackId ||
        trialEverUsed ||
        sessionTrialUsed
      );
    } catch (error) {
      // If we can't check, assume trial was used (security-first)
      return true;
    }
  };

  // Mark that this device/session has used a trial
  const markTrialAsUsed = (): void => {
    try {
      sessionStorage.setItem("trial_ever_used", "true");
      localStorage.setItem("trial_ever_used", Date.now().toString());
    } catch (error) {
      // Ignore storage errors
    }
  };

  // Check if user already has an active trial
  const checkExistingTrial = async (): Promise<TrialRecord | null> => {
    try {
      // Check if Appwrite is available
      if (!databases) {
        return null;
      }

      const sessionId = await getSessionId();
      const deviceFingerprint = getDeviceFingerprint();
      const ipAddress = await getUserIP();

      // Check for existing trials by session ID first (most reliable for same user)
      const sessionTrials = await databases.listDocuments(
        DATABASE_ID,
        TRIAL_COLLECTION_ID,
        [Query.equal("session_id", sessionId)],
      );

      // Find the most recent active trial by session ID
      const activeTrialBySession = sessionTrials.documents.find(
        (trial: any) => {
          const now = Date.now();
          const endTime = trial.end_time;
          const isActive = trial.is_active && now < endTime;
          return isActive;
        },
      ) as TrialRecord | undefined;

      if (activeTrialBySession) {
        return activeTrialBySession;
      }

      // If no active trial by session, check by device fingerprint (same device, different session)
      const deviceTrials = await databases.listDocuments(
        DATABASE_ID,
        TRIAL_COLLECTION_ID,
        [Query.equal("device_fingerprint", deviceFingerprint)],
      );

      // Find the most recent active trial by device
      const activeTrialByDevice = deviceTrials.documents.find((trial: any) => {
        const now = Date.now();
        const endTime = trial.end_time;
        const isActive = trial.is_active && now < endTime;
        return isActive;
      }) as TrialRecord | undefined;

      if (activeTrialByDevice) {
        return activeTrialByDevice;
      }

      // Only check IP as a last resort for very recent trials (within last 5 minutes)
      // This prevents abuse while allowing legitimate IP changes
      const ipTrials = await databases.listDocuments(
        DATABASE_ID,
        TRIAL_COLLECTION_ID,
        [Query.equal("ip_address", ipAddress)],
      );

      // Only consider IP-based blocking for very recent trials (within 5 minutes)
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      const activeTrialByIP = ipTrials.documents.find((trial: any) => {
        const now = Date.now();
        const endTime = trial.end_time;
        const isActive = trial.is_active && now < endTime;
        const isRecent = trial.start_time > fiveMinutesAgo;
        return isActive && isRecent;
      }) as TrialRecord | undefined;

      if (activeTrialByIP) {
        return activeTrialByIP;
      }

      return null;
    } catch (error) {
      return null;
    }
  };

  // Create a new trial record
  const createTrial = async (): Promise<TrialRecord | null> => {
    try {
      // Check if Appwrite is available
      if (!databases) {
        return null;
      }

      const sessionId = await getSessionId();
      const deviceFingerprint = getDeviceFingerprint();
      const ipAddress = await getUserIP();
      const startTime = Date.now();
      const endTime = startTime + TRIAL_DURATION_MS;

      // Check if we're already in the process of creating a trial (React Strict Mode protection)
      const isCreatingTrial = localStorage.getItem("creating_trial");
      if (isCreatingTrial) {
        // Wait a bit and check for existing trial
        await new Promise((resolve) => setTimeout(resolve, 100));
        const existingTrial = await checkExistingTrial();
        if (existingTrial) {
          return existingTrial;
        }
      }

      // Set flag to prevent duplicate creation
      if (typeof window !== "undefined") {
        localStorage.setItem("creating_trial", "true");
      }

      // Double-check for existing trials before creating (race condition protection)
      const existingTrial = await checkExistingTrial();
      if (existingTrial) {
        localStorage.removeItem("creating_trial");
        return existingTrial;
      }

      const trialRecord = await databases.createDocument(
        DATABASE_ID,
        TRIAL_COLLECTION_ID,
        "unique()", // Let Appwrite generate the ID
        {
          session_id: sessionId,
          ip_address: ipAddress,
          user_agent: navigator.userAgent,
          start_time: startTime,
          end_time: endTime,
          is_active: true,
          device_fingerprint: deviceFingerprint,
        },
      );

      // Store trial ID for later reference and mark trial as used
      if (typeof window !== "undefined") {
        localStorage.setItem("currentTrialId", trialRecord.$id);
        localStorage.removeItem("creating_trial"); // Clear the creation flag
        markTrialAsUsed(); // Mark that this device has used a trial
      }

      return trialRecord as unknown as TrialRecord;
    } catch (error) {
      // Clear the creation flag on error
      if (typeof window !== "undefined") {
        localStorage.removeItem("creating_trial");
      }
      return null;
    }
  };

  // Mark trial as expired
  const expireTrial = async (trialId: string) => {
    try {
      // Check if Appwrite is available
      if (!databases) {
        return;
      }

      await databases.updateDocument(
        DATABASE_ID,
        TRIAL_COLLECTION_ID,
        trialId,
        {
          is_active: false,
        },
      );
    } catch (error) {
      // Ignore errors
    }
  };

  useEffect(() => {
    const initializeTrial = async () => {
      setIsLoading(true);

      // If user is authenticated, no trial needed
      if (isAuthenticated) {
        setTrialStartTime(null);
        setTrialExpired(false);
        setTimeRemaining(TRIAL_DURATION_MS);
        setTrialBlocked(false);
        setIsLoading(false);
        return;
      }

      try {
        // First check if user already has an active trial (allow resuming)
        const existingTrial = await checkExistingTrial();

        if (existingTrial) {
          // User already has an active trial
          const now = Date.now();
          const elapsed = now - existingTrial.start_time;

          if (elapsed >= TRIAL_DURATION_MS) {
            // Trial has expired
            await expireTrial(existingTrial.$id);
            setTrialExpired(true);
            setTrialBlocked(true);
            setTimeRemaining(0);
          } else {
            // Trial is still active
            setTrialStartTime(existingTrial.start_time);
            setTimeRemaining(TRIAL_DURATION_MS - elapsed);
            setTrialExpired(false);
            setTrialBlocked(false);
            // Store trial ID for timer reference
            if (typeof window !== "undefined") {
              localStorage.setItem("currentTrialId", existingTrial.$id);
            }
          }
        } else {
          // No existing trial found on server
          // Check if device has evidence of previous trial usage
          if (hasUsedTrialBefore()) {
            // Device shows evidence of previous trial - block access for security
            setTrialExpired(true);
            setTrialBlocked(true);
            setTimeRemaining(0);
            setTrialStartTime(null);
          } else {
            // Genuinely new device/session - create a new trial
            const newTrial = await createTrial();

            if (newTrial) {
              setTrialStartTime(newTrial.start_time);
              setTimeRemaining(TRIAL_DURATION_MS);
              setTrialExpired(false);
              setTrialBlocked(false);
            } else {
              // Failed to create trial - be conservative and block access
              setTrialExpired(true);
              setTrialBlocked(true);
              setTimeRemaining(0);
              setTrialStartTime(null);
            }
          }
        }
      } catch (error) {
        setTrialExpired(true);
        setTrialBlocked(true);
        setTimeRemaining(0);
        setTrialStartTime(null);

        // Check localStorage for any existing trial state to prevent bypass
        const localTrialId = localStorage.getItem("currentTrialId");
        const localSessionId = localStorage.getItem("trial_session_id");

        // If we have local trial data, assume trial was already used (security-first approach)
        if (localTrialId || localSessionId) {
          setTrialExpired(true);
          setTrialBlocked(true);
          setTimeRemaining(0);
          setTrialStartTime(null);
        } else {
          // Only allow new trial if no local evidence of previous trial exists
          // This is a fallback for genuine first-time users with network issues
          setTrialStartTime(Date.now());
          setTimeRemaining(TRIAL_DURATION_MS);
          setTrialExpired(false);
          setTrialBlocked(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeTrial();
  }, [isAuthenticated]);

  // Update timer every second
  useEffect(() => {
    if (trialExpired || isAuthenticated || !trialStartTime) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - trialStartTime;
      const remaining = TRIAL_DURATION_MS - elapsed;

      if (remaining <= 0) {
        setTrialExpired(true);
        setTrialBlocked(true);
        setTimeRemaining(0);
        // Mark trial as expired in database and locally
        if (typeof window !== "undefined") {
          const trialId = localStorage.getItem("currentTrialId");
          if (trialId) {
            expireTrial(trialId);
            localStorage.removeItem("currentTrialId");
          }
          markTrialAsUsed(); // Ensure trial usage is marked locally
        }
      } else {
        setTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [trialStartTime, trialExpired, isAuthenticated]);

  const formatTimeRemaining = () => {
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const isInTrial =
    !isAuthenticated &&
    !trialExpired &&
    !trialBlocked &&
    trialStartTime !== null;
  const isAccessBlocked = !isAuthenticated && (trialExpired || trialBlocked);

  return {
    trialExpired,
    timeRemaining,
    formatTimeRemaining,
    isInTrial,
    isAccessBlocked,
    trialBlocked,
    isLoading,
  };
};
