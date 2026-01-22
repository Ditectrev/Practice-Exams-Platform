import { NextRequest, NextResponse } from "next/server";
import { Client, Databases } from "node-appwrite";

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

export async function GET(request: NextRequest) {
  try {
    // Get user email and ID from query params
    const email =
      request.nextUrl.searchParams.get("email") || "user@example.com";
    const userId = request.nextUrl.searchParams.get("userId");

    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const USERS_COLLECTION_ID = "users";
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
        if (latestSubscription.current_period_end) {
          subscriptionExpiresAt = latestSubscription.current_period_end;
        }
      }

      // Try to find user by email in users collection (optional - user might not exist)
      let userData = null;
      try {
        const users = await databases.listDocuments(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          [Query.equal("email", email)],
        );

        if (users.documents.length > 0) {
          userData = users.documents[0];
        }
      } catch (userError: any) {
        // Users collection might not exist or have permission issues - that's okay
        // Silently continue without user data
      }

      if (userData) {
        return NextResponse.json({
          id: userData.$id,
          email: userData.email || email,
          subscription: subscriptionType,
          subscriptionExpiresAt,
          apiKeys: userData.apiKeys || defaultUser.apiKeys,
          preferences: userData.preferences || defaultUser.preferences,
        });
      } else {
        // User doesn't exist yet, return with subscription from subscriptions collection
        return NextResponse.json({
          id: userId || "new",
          email,
          subscription: subscriptionType,
          subscriptionExpiresAt,
          apiKeys: defaultUser.apiKeys,
          preferences: defaultUser.preferences,
        });
      }
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // TODO: Update user in database
    // const user = await updateUser(email, body);

    // For now, just return success
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
