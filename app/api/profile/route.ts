import { NextRequest, NextResponse } from "next/server";
import { Client, Databases } from "node-appwrite";
import Stripe from "stripe";

// Initialize Appwrite client
function getAppwriteClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "")
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "")
    .setKey(process.env.NEXT_PUBLIC_APPWRITE_API_KEY || "");

  return new Databases(client);
}

// Default user data structure
const defaultUser = {
  subscription: "free" as const,
  apiKeys: {
    openai: "",
    gemini: "",
    mistral: "",
    deepseek: "",
  },
  preferences: {
    explanationProvider: "ollama" as const,
  },
};

// Helper to mask API keys for display
function maskApiKey(key: string | undefined): string {
  if (!key) return "";
  // If key is already masked or encrypted, show indicator
  if (key.includes(":") || key.startsWith("••")) {
    return "••••••••";
  }
  // Show last 4 chars
  if (key.length > 4) {
    return "••••••••" + key.slice(-4);
  }
  return "••••••••";
}

export async function GET(request: NextRequest) {
  try {
    // Get user email and ID from query params
    const email =
      request.nextUrl.searchParams.get("email") || "user@example.com";
    const userId = request.nextUrl.searchParams.get("userId");

    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const API_KEYS_COLLECTION_ID =
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID_EXPLANATIONS_API_KEYS!;
    const SUBSCRIPTIONS_COLLECTION_ID =
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID_SUBSCRIPTIONS ||
      "subscriptions";

    if (!DATABASE_ID) {
      console.warn("Appwrite not configured, returning default user");
      return NextResponse.json({
        id: "default",
        email,
        ...defaultUser,
      });
    }

    try {
      const databases = getAppwriteClient();
      const { Query } = await import("node-appwrite");

      // Find active subscription by appwrite_user_id (primary) or email (fallback)
      // appwrite_user_id is more reliable since it links to the logged-in user
      // regardless of what email they used in Stripe checkout
      let subscriptions: any = null;
      try {
        // First try by appwrite_user_id (most reliable - links to logged-in user)
        if (userId) {
          subscriptions = await databases.listDocuments(
            DATABASE_ID,
            SUBSCRIPTIONS_COLLECTION_ID,
            [
              Query.equal("appwrite_user_id", userId),
              Query.equal("subscription_status", "active"),
            ],
          );

          // If no active subscription, check for trialing status
          if (subscriptions.documents.length === 0) {
            const allSubs = await databases.listDocuments(
              DATABASE_ID,
              SUBSCRIPTIONS_COLLECTION_ID,
              [Query.equal("appwrite_user_id", userId)],
            );
            // Filter for active or trialing subscriptions
            subscriptions = {
              documents: allSubs.documents.filter(
                (sub: any) =>
                  sub.subscription_status === "active" ||
                  sub.subscription_status === "trialing",
              ),
            };
          }
        }

        // Fallback to email if no subscription found by user ID
        if (!subscriptions || subscriptions.documents.length === 0) {
          subscriptions = await databases.listDocuments(
            DATABASE_ID,
            SUBSCRIPTIONS_COLLECTION_ID,
            [
              Query.equal("email", email),
              Query.equal("subscription_status", "active"),
            ],
          );

          // If no active subscription, check for trialing status
          if (subscriptions.documents.length === 0) {
            const allSubs = await databases.listDocuments(
              DATABASE_ID,
              SUBSCRIPTIONS_COLLECTION_ID,
              [Query.equal("email", email)],
            );
            // Filter for active or trialing subscriptions
            subscriptions = {
              documents: allSubs.documents.filter(
                (sub: any) =>
                  sub.subscription_status === "active" ||
                  sub.subscription_status === "trialing",
              ),
            };
          }
        }
      } catch (subError: any) {
        console.error("Error querying subscriptions:", subError.message);
        // Continue with default subscription if query fails
        subscriptions = { documents: [] };
      }

      let subscriptionType:
        | "free"
        | "ads-free"
        | "local"
        | "byok"
        | "ditectrev" = defaultUser.subscription;
      let subscriptionExpiresAt: number | undefined = undefined;
      if (subscriptions && subscriptions.documents.length > 0) {
        // Get the most recent active subscription
        const latestSubscription = subscriptions.documents.sort(
          (a: any, b: any) =>
            (b.$updatedAt ? new Date(b.$updatedAt).getTime() : 0) -
            (a.$updatedAt ? new Date(a.$updatedAt).getTime() : 0),
        )[0];
        const subType = latestSubscription.subscription_type as string;
        if (["ads-free", "local", "byok", "ditectrev"].includes(subType)) {
          subscriptionType = subType as
            | "ads-free"
            | "local"
            | "byok"
            | "ditectrev";
        }
        // Get expiration date (current_period_end is a Unix timestamp)
        // Handle both integer and string formats
        let periodEnd = latestSubscription.current_period_end;

        // If missing from database, fetch from Stripe as fallback
        if (
          (periodEnd === undefined || periodEnd === null || periodEnd === 0) &&
          latestSubscription.stripe_subscription_id
        ) {
          try {
            const stripeSecretKey = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY;
            if (stripeSecretKey) {
              const stripe = new Stripe(stripeSecretKey, {
                apiVersion: "2025-11-17.clover",
              });
              const stripeSubscription = (await stripe.subscriptions.retrieve(
                latestSubscription.stripe_subscription_id,
              )) as Stripe.Subscription;

              // In newer Stripe API, period dates are in items.data[0], not at top level
              const subAny = stripeSubscription as any;
              let fetchedPeriodEnd =
                subAny.current_period_end ??
                subAny.items?.data?.[0]?.current_period_end ??
                null;
              let fetchedPeriodStart =
                subAny.current_period_start ??
                subAny.items?.data?.[0]?.current_period_start ??
                null;

              // Convert to numbers if needed
              if (fetchedPeriodEnd && typeof fetchedPeriodEnd === "string") {
                fetchedPeriodEnd = parseInt(fetchedPeriodEnd, 10);
              }
              if (
                fetchedPeriodStart &&
                typeof fetchedPeriodStart === "string"
              ) {
                fetchedPeriodStart = parseInt(fetchedPeriodStart, 10);
              }

              // Update periodEnd for use below
              periodEnd = fetchedPeriodEnd;

              // Update the database with the fetched value for future requests
              if (fetchedPeriodStart && fetchedPeriodEnd) {
                try {
                  await databases.updateDocument(
                    DATABASE_ID,
                    SUBSCRIPTIONS_COLLECTION_ID,
                    latestSubscription.$id,
                    {
                      current_period_end: Number(fetchedPeriodEnd),
                      current_period_start: Number(fetchedPeriodStart),
                    },
                  );
                } catch (updateError: any) {
                  // Silently fail - period dates will be set on next webhook event
                }
              }
            }
          } catch (stripeError: any) {
            // Silently fail - period dates will be set on next webhook event
          }
        }

        if (periodEnd !== undefined && periodEnd !== null && periodEnd > 0) {
          // Convert to number if it's a string
          subscriptionExpiresAt =
            typeof periodEnd === "string" ? parseInt(periodEnd, 10) : periodEnd;
        }
      }

      // Try to find user preferences/API keys in users collection
      let userData = null;
      try {
        // First try by appwrite_user_id (most reliable)
        if (userId) {
          const users = await databases.listDocuments(
            DATABASE_ID,
            API_KEYS_COLLECTION_ID,
            [Query.equal("appwrite_user_id", userId)],
          );
          if (users.documents.length > 0) {
            userData = users.documents[0];
          }
        }

        // Fallback to email lookup if no user found by ID
        if (!userData) {
          const users = await databases.listDocuments(
            DATABASE_ID,
            API_KEYS_COLLECTION_ID,
            [Query.equal("email", email)],
          );
          if (users.documents.length > 0) {
            userData = users.documents[0];
          }
        }
      } catch (userError: any) {
        // Users collection might not exist or have permission issues - that's okay
        // Silently continue without user data
      }

      // Build API keys object with masked values for display
      const apiKeys = {
        openai: userData?.openai_api_key
          ? maskApiKey(userData.openai_api_key)
          : "",
        gemini: userData?.gemini_api_key
          ? maskApiKey(userData.gemini_api_key)
          : "",
        mistral: userData?.mistral_api_key
          ? maskApiKey(userData.mistral_api_key)
          : "",
        deepseek: userData?.deepseek_api_key
          ? maskApiKey(userData.deepseek_api_key)
          : "",
      };

      // Build preferences object
      const preferences = {
        explanationProvider:
          userData?.explanation_provider ||
          defaultUser.preferences.explanationProvider,
      };

      const responseData = {
        id: userData?.$id || userId || "new",
        email: userData?.email || email,
        subscription: subscriptionType,
        subscriptionExpiresAt,
        apiKeys,
        preferences,
      };

      return NextResponse.json(responseData);
    } catch (dbError: any) {
      console.error("Database error:", dbError.message);
      // Return default user on error
      return NextResponse.json({
        id: "error",
        email,
        ...defaultUser,
      });
    }
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}
