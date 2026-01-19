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
    // TODO: Get user email from authentication context
    // For now, we'll try to get it from query params or use a default
    // In production, you should get this from your auth system
    const email =
      request.nextUrl.searchParams.get("email") || "user@example.com";

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

      // Try to find active subscription by email
      const subscriptions = await databases.listDocuments(
        DATABASE_ID,
        SUBSCRIPTIONS_COLLECTION_ID,
        [
          Query.equal("email", email),
          Query.equal("subscription_status", "active"),
        ],
      );

      let subscriptionType:
        | "free"
        | "ads-free"
        | "local"
        | "byok"
        | "ditectrev" = defaultUser.subscription;
      if (subscriptions.documents.length > 0) {
        // Get the most recent active subscription
        const latestSubscription = subscriptions.documents.sort(
          (a, b) =>
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
