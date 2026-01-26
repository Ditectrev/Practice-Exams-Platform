import { NextRequest, NextResponse } from "next/server";
import { Client, Databases, Query } from "node-appwrite";
import { ExplanationService } from "../../../lib/explanation-service";
import crypto from "crypto";

// Decrypt API key (same logic as in api-keys route)
function decryptApiKey(encryptedKey: string): string {
  if (!encryptedKey) return "";
  const encryptionKey = process.env.ENCRYPTION_SECRET;
  if (!encryptionKey || !encryptedKey.includes(":")) {
    return encryptedKey;
  }

  try {
    const [ivHex, encrypted] = encryptedKey.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const key = crypto.scryptSync(encryptionKey, "salt", 32);
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      key as unknown as crypto.CipherKey,
      iv as unknown as crypto.BinaryLike,
    );
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return "";
  }
}

// Initialize Appwrite client
function getAppwriteClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "")
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "")
    .setKey(process.env.NEXT_PUBLIC_APPWRITE_API_KEY || "");

  return new Databases(client);
}

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "";
const API_KEYS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID_EXPLANATIONS_API_KEYS!;
const SUBSCRIPTIONS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID_SUBSCRIPTIONS ||
  "subscriptions";

export async function POST(request: NextRequest) {
  try {
    const { question, correctAnswers, userId } = await request.json();

    if (!question || !correctAnswers || correctAnswers.length === 0) {
      return NextResponse.json(
        { error: "Question and correct answers are required" },
        { status: 400 },
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User authentication required" },
        { status: 401 },
      );
    }

    if (!DATABASE_ID) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 },
      );
    }

    const databases = getAppwriteClient();

    // Fetch user's subscription
    let subscriptionType = "free";
    try {
      const subscriptions = await databases.listDocuments(
        DATABASE_ID,
        SUBSCRIPTIONS_COLLECTION_ID,
        [
          Query.equal("appwrite_user_id", userId),
          Query.equal("subscription_status", "active"),
        ],
      );

      if (subscriptions.documents.length > 0) {
        // Get the most recent subscription
        const latestSub = subscriptions.documents.sort(
          (a: any, b: any) =>
            new Date(b.$updatedAt || 0).getTime() -
            new Date(a.$updatedAt || 0).getTime(),
        )[0];
        subscriptionType = latestSub.subscription_type || "free";
      }
    } catch (subError: any) {
      console.error("Error fetching subscription:", subError.message);
    }

    // Check if subscription allows explanations
    if (!["local", "byok", "ditectrev"].includes(subscriptionType)) {
      return NextResponse.json(
        {
          error:
            "Your subscription does not include AI explanations. Please upgrade to access this feature.",
        },
        { status: 403 },
      );
    }

    // Fetch user preferences and API keys
    let userPreferences = { explanationProvider: "ollama" };
    let userApiKeys: Record<string, string> = {};

    try {
      const users = await databases.listDocuments(
        DATABASE_ID,
        API_KEYS_COLLECTION_ID,
        [Query.equal("appwrite_user_id", userId)],
      );

      if (users.documents.length > 0) {
        const user = users.documents[0];
        userPreferences.explanationProvider =
          user.explanation_provider || "ollama";

        // Decrypt API keys
        const providers = ["openai", "gemini", "mistral", "deepseek"];
        for (const provider of providers) {
          const encryptedKey = user[`${provider}_api_key`];
          if (encryptedKey) {
            userApiKeys[provider] = decryptApiKey(encryptedKey);
          }
        }
      }
    } catch (userError: any) {
      console.error("Error fetching user data:", userError.message);
      // Continue with defaults
    }

    // Validate that user can use the selected provider
    const provider = userPreferences.explanationProvider;

    // Check subscription access for provider
    if (provider === "ditectrev" && subscriptionType !== "ditectrev") {
      return NextResponse.json(
        {
          error:
            "Ditectrev AI is only available with the Ditectrev subscription.",
        },
        { status: 403 },
      );
    }

    if (
      ["openai", "gemini", "mistral", "deepseek"].includes(provider) &&
      !["byok", "ditectrev"].includes(subscriptionType)
    ) {
      return NextResponse.json(
        {
          error: `${provider} requires a BYOK or Ditectrev subscription.`,
        },
        { status: 403 },
      );
    }

    // Check if API key is available for BYOK providers
    if (
      ["openai", "gemini", "mistral", "deepseek"].includes(provider) &&
      !userApiKeys[provider]
    ) {
      return NextResponse.json(
        {
          error: `Please add your ${
            provider.charAt(0).toUpperCase() + provider.slice(1)
          } API key in your profile settings.`,
        },
        { status: 400 },
      );
    }

    // Generate explanation
    const explanationService = new ExplanationService();

    const explanation = await explanationService.generateExplanation({
      question,
      correctAnswers,
      userSubscription: subscriptionType,
      userPreferences,
      userApiKeys,
    });

    return NextResponse.json({ explanation });
  } catch (error: any) {
    console.error("Error generating explanation:", error.message);
    return NextResponse.json(
      {
        error: error.message || "Failed to generate explanation",
      },
      { status: 500 },
    );
  }
}
