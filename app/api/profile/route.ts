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

      // Check subscriptions collection for active subscription
      const SUBSCRIPTIONS_COLLECTION_ID =
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID_SUBSCRIPTIONS ||
        "subscriptions";

      // Try to find active subscription by appwrite_user_id (preferred) or email
      let subscriptions;
      if (userId) {
        // First try by appwrite_user_id with active status
        subscriptions = await databases.listDocuments(
          DATABASE_ID,
          SUBSCRIPTIONS_COLLECTION_ID,
          [
            Query.equal("appwrite_user_id", userId),
            Query.equal("subscription_status", "active"),
          ],
        );
        console.log(
          `🔍 Looking for active subscription by userId ${userId}:`,
          subscriptions.documents.length,
          "found",
        );

        // If no active subscription, check all subscriptions for this user
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
              allSubs.documents.map((s) => ({
                status: s.subscription_status,
                type: s.subscription_type,
                email: s.email,
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

      // If no subscription found by user ID, try by email
      if (!subscriptions || subscriptions.documents.length === 0) {
        subscriptions = await databases.listDocuments(
          DATABASE_ID,
          SUBSCRIPTIONS_COLLECTION_ID,
          [
            Query.equal("email", email),
            Query.equal("subscription_status", "active"),
          ],
        );
        console.log(
          `🔍 Looking for subscription by email ${email}:`,
          subscriptions.documents.length,
          "found",
        );
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
          (a, b) =>
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

      // Try to find user by email in users collection
      const users = await databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        [Query.equal("email", email)],
      );

      if (users.documents.length > 0) {
        const user = users.documents[0];
        return NextResponse.json({
          id: user.$id,
          email: user.email || email,
          subscription: subscriptionType,
          apiKeys: user.apiKeys || defaultUser.apiKeys,
          preferences: user.preferences || defaultUser.preferences,
        });
      } else {
        // User doesn't exist yet, return default with subscription from subscriptions collection
        return NextResponse.json({
          id: "new",
          email,
          subscription: subscriptionType,
          apiKeys: defaultUser.apiKeys,
          preferences: defaultUser.preferences,
        });
      }
    } catch (dbError: any) {
      console.error("Database error:", dbError);
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
