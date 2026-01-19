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

    console.log("📥 Profile API called with:", { email, userId });

    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const USERS_COLLECTION_ID = "users";
    const SUBSCRIPTIONS_COLLECTION_ID =
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID_SUBSCRIPTIONS ||
      "subscriptions";

    console.log("📥 Database ID:", DATABASE_ID);
    console.log("📥 Subscriptions Collection ID:", SUBSCRIPTIONS_COLLECTION_ID);

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

      // Try to find active subscription by email (more reliable) or appwrite_user_id
      let subscriptions: any = null;
      try {
        console.log(
          `🔍 Querying subscriptions for email: "${email}" and userId: "${userId}"`,
        );
        console.log(
          `🔍 Database: ${DATABASE_ID}, Collection: ${SUBSCRIPTIONS_COLLECTION_ID}`,
        );

        // First try by email with active status (email is more reliable)
        subscriptions = await databases.listDocuments(
          DATABASE_ID,
          SUBSCRIPTIONS_COLLECTION_ID,
          [
            Query.equal("email", email),
            Query.equal("subscription_status", "active"),
          ],
        );
        console.log(
          `🔍 Looking for active subscription by email "${email}":`,
          subscriptions.documents.length,
          "found",
        );

        if (subscriptions.documents.length > 0) {
          console.log(
            "✅ Found subscriptions by email:",
            subscriptions.documents.map((s: any) => ({
              id: s.$id,
              userId: s.appwrite_user_id,
              email: s.email,
              type: s.subscription_type,
              status: s.subscription_status,
            })),
          );
        }

        // If no subscription found by email, try by appwrite_user_id
        if (!subscriptions || subscriptions.documents.length === 0) {
          if (userId) {
            console.log(
              `🔍 No subscription found by email, trying userId: "${userId}"`,
            );
            subscriptions = await databases.listDocuments(
              DATABASE_ID,
              SUBSCRIPTIONS_COLLECTION_ID,
              [
                Query.equal("appwrite_user_id", userId),
                Query.equal("subscription_status", "active"),
              ],
            );
            console.log(
              `🔍 Looking for active subscription by userId "${userId}":`,
              subscriptions.documents.length,
              "found",
            );

            if (subscriptions.documents.length > 0) {
              console.log(
                "✅ Found subscriptions by userId:",
                subscriptions.documents.map((s: any) => ({
                  id: s.$id,
                  userId: s.appwrite_user_id,
                  email: s.email,
                  type: s.subscription_type,
                  status: s.subscription_status,
                })),
              );
            }

            // If still no active subscription, check all subscriptions for this user ID
            if (subscriptions.documents.length === 0) {
              const allSubs = await databases.listDocuments(
                DATABASE_ID,
                SUBSCRIPTIONS_COLLECTION_ID,
                [Query.equal("appwrite_user_id", userId)],
              );
              console.log(
                `🔍 All subscriptions for userId ${userId}:`,
                allSubs.documents.length,
                "found",
              );
              if (allSubs.documents.length > 0) {
                console.log(
                  "Subscription statuses:",
                  allSubs.documents.map((s: any) => ({
                    status: s.subscription_status,
                    type: s.subscription_type,
                    email: s.email,
                    userId: s.appwrite_user_id,
                  })),
                );
                // Filter for active or trialing subscriptions
                subscriptions = {
                  documents: allSubs.documents.filter(
                    (sub: any) =>
                      sub.subscription_status === "active" ||
                      sub.subscription_status === "trialing",
                  ),
                };
                console.log(
                  `✅ Filtered to active/trialing:`,
                  subscriptions.documents.length,
                  "found",
                );
              }
            }
          }
        }
      } catch (subError: any) {
        console.error("❌ Error querying subscriptions:", {
          message: subError.message,
          code: subError.code,
          type: subError.type,
        });
        // Continue with default subscription if query fails
        subscriptions = { documents: [] };
      }

      let subscriptionType:
        | "free"
        | "ads-free"
        | "local"
        | "byok"
        | "ditectrev" = defaultUser.subscription;
      if (subscriptions && subscriptions.documents.length > 0) {
        // Get the most recent active subscription
        const latestSubscription = subscriptions.documents.sort(
          (a: any, b: any) =>
            (b.$updatedAt ? new Date(b.$updatedAt).getTime() : 0) -
            (a.$updatedAt ? new Date(a.$updatedAt).getTime() : 0),
        )[0];
        const subType = latestSubscription.subscription_type as string;
        console.log(`✅ Found subscription type:`, subType);
        if (["ads-free", "local", "byok", "ditectrev"].includes(subType)) {
          subscriptionType = subType as
            | "ads-free"
            | "local"
            | "byok"
            | "ditectrev";
        }
      } else {
        console.log(
          `⚠️ No active subscription found for user ${userId || email}`,
        );
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
        console.log(
          "⚠️ Could not fetch user from users collection:",
          userError.message,
        );
      }

      if (userData) {
        return NextResponse.json({
          id: userData.$id,
          email: userData.email || email,
          subscription: subscriptionType,
          apiKeys: userData.apiKeys || defaultUser.apiKeys,
          preferences: userData.preferences || defaultUser.preferences,
        });
      } else {
        // User doesn't exist yet, return with subscription from subscriptions collection
        return NextResponse.json({
          id: userId || "new",
          email,
          subscription: subscriptionType,
          apiKeys: defaultUser.apiKeys,
          preferences: defaultUser.preferences,
        });
      }
    } catch (dbError: any) {
      console.error("Database error:", dbError);
      console.error("Error details:", {
        message: dbError.message,
        code: dbError.code,
        type: dbError.type,
        response: dbError.response,
      });
      // Return default user on error, but include error info for debugging
      return NextResponse.json({
        id: "error",
        email,
        ...defaultUser,
        error:
          process.env.NODE_ENV !== "production"
            ? {
                message: dbError.message,
                code: dbError.code,
              }
            : undefined,
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
    // const user = await updateUser(userId, body);

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
