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
  // Email OTP Authentication
  static async createEmailSession(
    email: string,
  ): Promise<{ success: boolean; error?: AuthError }> {
    try {
      await (account as any).createMagicURLSession(
        ID.unique(),
        email,
        `${window.location.origin}/auth/callback`,
      );
      return { success: true };
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

  static async updateEmailSession(
    userId: string,
    secret: string,
  ): Promise<{ success: boolean; error?: AuthError }> {
    try {
      await account.updateMagicURLSession(userId, secret);
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
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const url = await account.createOAuth2Session(
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
  static async createAppleSession(): Promise<{
    success: boolean;
    error?: AuthError;
  }> {
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const url = await account.createOAuth2Session(
        "apple" as any,
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
      const user = await account.get();
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
      await account.deleteSession("current");
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
      await account.get();
      return true;
    } catch {
      return false;
    }
  }
}
