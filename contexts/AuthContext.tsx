"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthService, AuthUser } from "../lib/appwrite/auth";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sendEmailOTP: (
    email: string,
  ) => Promise<{ success: boolean; error?: string; userId?: string }>;
  verifyOTPAndSignIn: (
    userId: string,
    otp: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithApple: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const refreshUser = async () => {
    try {
      const result = await AuthService.getCurrentUser();
      if (result.user) {
        setUser(result.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmailOTP = async (email: string) => {
    try {
      const result = await AuthService.createEmailOTPSession(email);
      if (result.success) {
        return { success: true, userId: result.userId };
      } else {
        return { success: false, error: result.error?.message };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const verifyOTPAndSignIn = async (userId: string, otp: string) => {
    try {
      const result = await AuthService.verifyEmailOTP(userId, otp);
      if (result.success) {
        // Refresh user state after successful OTP verification
        await refreshUser();
        return { success: true };
      } else {
        return { success: false, error: result.error?.message };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await AuthService.createGoogleSession();
      return {
        success: result.success,
        error: result.error?.message,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signInWithApple = async () => {
    try {
      const result = await AuthService.createAppleSession();
      return {
        success: result.success,
        error: result.error?.message,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      await AuthService.signOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    sendEmailOTP,
    verifyOTPAndSignIn,
    signInWithGoogle,
    signInWithApple,
    signOut,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
