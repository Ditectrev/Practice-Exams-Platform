import { account } from "./config";
import { ID } from "appwrite";

export interface AuthUser {
  $id: string;
  email: string;
  name?: string;
  emailVerification: boolean;
}

export interface AuthError {
  message: string;
  code?: number;
}

export class AuthService {
  // Check if Appwrite is available
  private static checkAppwriteAvailable() {
    if (!account) {
      throw new Error(
        "Appwrite is not initialized. Please check your environment variables.",
      );
    }
  }

  // Email OTP Authentication
  static async createEmailOTPSession(
    email: string,
  ): Promise<{ success: boolean; error?: AuthError; userId?: string }> {
    try {
      this.checkAppwriteAvailable();
      // Create email token (sends 6-digit OTP to email)
      const sessionToken = await account!.createEmailToken(ID.unique(), email);
      return { success: true, userId: sessionToken.userId };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || "Failed to send OTP",
          code: error.code,
        },
      };
    }
  }

  // Verify Email OTP
  static async verifyEmailOTP(
    userId: string,
    otp: string,
  ): Promise<{ success: boolean; error?: AuthError }> {
    try {
      this.checkAppwriteAvailable();
      // Create session with userId and OTP
      await account!.createSession(userId, otp);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || "Failed to verify OTP",
          code: error.code,
        },
      };
    }
  }

  // Google OAuth
  static async createGoogleSession(): Promise<{
    success: boolean;
    error?: AuthError;
  }> {
    try {
      this.checkAppwriteAvailable();
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const url = await account!.createOAuth2Session(
        "google" as any,
        redirectUrl,
        redirectUrl,
      );

      if (typeof url === "string") {
        window.location.href = url;
      }
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || "Failed to initiate Google OAuth",
          code: error.code,
        },
      };
    }
  }

  // Apple OAuth
  // NOTE: Apple Sign-In doesn't work with localhost in development
  // Apple requires a proper domain for redirect URIs. Test this in production.
  static async createAppleSession(): Promise<{
    success: boolean;
    error?: AuthError;
  }> {
    try {
      this.checkAppwriteAvailable();

      // Check if we're in development (localhost)
      if (
        typeof window !== "undefined" &&
        window.location.hostname === "localhost"
      ) {
        return {
          success: false,
          error: {
            message:
              "Apple OAuth requires HTTPS and a proper domain. Please test in production.",
            code: 400,
          },
        };
      }

      const redirectUrl = `${window.location.origin}/auth/callback`;

      // Add debug info to sessionStorage for production debugging
      if (typeof window !== "undefined") {
        const debugInfo = {
          timestamp: new Date().toISOString(),
          action: "apple_oauth_start",
          redirectUrl,
          origin: window.location.origin,
          hostname: window.location.hostname,
        };

        try {
          sessionStorage.setItem(
            "apple_oauth_debug",
            JSON.stringify(debugInfo),
          );
          // Also add to window object for console inspection
          (window as any).appleOAuthDebug = debugInfo;
        } catch (e) {
          // Ignore storage errors
        }
      }

      const url = await account!.createOAuth2Session(
        "apple" as any,
        redirectUrl,
        redirectUrl,
      );

      if (typeof url === "string") {
        // Store success info
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem("apple_oauth_redirect_url", url);
          } catch (e) {
            // Ignore storage errors
          }
        }
        window.location.href = url;
      }
      return { success: true };
    } catch (error: any) {
      // Store error info for debugging in production
      if (typeof window !== "undefined") {
        const errorInfo = {
          timestamp: new Date().toISOString(),
          action: "apple_oauth_error",
          message: error.message,
          code: error.code,
          type: error.type,
          name: error.name,
          stack: error.stack,
        };

        try {
          sessionStorage.setItem(
            "apple_oauth_error",
            JSON.stringify(errorInfo),
          );
          // Also add to window object
          (window as any).appleOAuthError = errorInfo;
        } catch (e) {
          // Ignore storage errors
        }
      }

      return {
        success: false,
        error: {
          message: error.message || "Failed to initiate Apple OAuth",
          code: error.code,
        },
      };
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<{
    user?: AuthUser;
    error?: AuthError;
  }> {
    try {
      this.checkAppwriteAvailable();
      const user = await account!.get();
      return {
        user: {
          $id: user.$id,
          email: user.email,
          name: user.name,
          emailVerification: user.emailVerification,
        },
      };
    } catch (error: any) {
      return {
        error: {
          message: error.message || "Failed to get current user",
          code: error.code,
        },
      };
    }
  }

  // Sign out
  static async signOut(): Promise<{ success: boolean; error?: AuthError }> {
    try {
      this.checkAppwriteAvailable();
      await account!.deleteSession("current");
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || "Failed to sign out",
          code: error.code,
        },
      };
    }
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    try {
      this.checkAppwriteAvailable();
      await account!.get();
      return true;
    } catch {
      return false;
    }
  }
}
