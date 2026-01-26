import { NextRequest, NextResponse } from "next/server";
import { Client, Databases, Query } from "node-appwrite";
import crypto from "crypto";

// Simple encryption for API keys (uses environment variable as key)
function encryptApiKey(apiKey: string): string {
  if (!apiKey) return "";
  const encryptionKey = process.env.ENCRYPTION_SECRET;
  if (!encryptionKey) {
    // If no encryption key is set, store as-is (not recommended for production)
    return apiKey;
  }

  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(encryptionKey, "salt", 32);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    key as unknown as crypto.CipherKey,
    iv as unknown as crypto.BinaryLike,
  );
  let encrypted = cipher.update(apiKey, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decryptApiKey(encryptedKey: string): string {
  if (!encryptedKey) return "";
  const encryptionKey = process.env.ENCRYPTION_SECRET;
  if (!encryptionKey || !encryptedKey.includes(":")) {
    // If no encryption key or key isn't encrypted, return as-is
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
    // If decryption fails, return empty string
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

export async function POST(request: NextRequest) {
  try {
    const { apiKeys, userId, email } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    if (!DATABASE_ID) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 },
      );
    }

    const databases = getAppwriteClient();

    // Encrypt API keys before storing
    const encryptedKeys: Record<string, string> = {};
    for (const [provider, key] of Object.entries(apiKeys)) {
      if (key && typeof key === "string") {
        encryptedKeys[`${provider}_api_key`] = encryptApiKey(key);
      }
    }

    // Check if user document exists
    const existingUsers = await databases.listDocuments(
      DATABASE_ID,
      API_KEYS_COLLECTION_ID,
      [Query.equal("appwrite_user_id", userId)],
    );

    if (existingUsers.documents.length > 0) {
      // Update existing user document
      await databases.updateDocument(
        DATABASE_ID,
        API_KEYS_COLLECTION_ID,
        existingUsers.documents[0].$id,
        encryptedKeys,
      );
    } else {
      // Create new user document
      await databases.createDocument(
        DATABASE_ID,
        API_KEYS_COLLECTION_ID,
        "unique()",
        {
          appwrite_user_id: userId,
          email: email || "",
          ...encryptedKeys,
        },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error saving API keys:", error.message);
    return NextResponse.json(
      { error: "Failed to save API keys" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    if (!DATABASE_ID) {
      return NextResponse.json({ apiKeys: {} });
    }

    const databases = getAppwriteClient();

    const users = await databases.listDocuments(
      DATABASE_ID,
      API_KEYS_COLLECTION_ID,
      [Query.equal("appwrite_user_id", userId)],
    );

    if (users.documents.length === 0) {
      return NextResponse.json({ apiKeys: {} });
    }

    const user = users.documents[0];

    // Decrypt API keys before returning
    // Only return masked versions for display (last 4 chars)
    const apiKeys: Record<string, string> = {};
    const providers = ["openai", "gemini", "mistral", "deepseek"];

    for (const provider of providers) {
      const encryptedKey = user[`${provider}_api_key`];
      if (encryptedKey) {
        const decrypted = decryptApiKey(encryptedKey);
        // Return masked key for display: ****...last4
        if (decrypted.length > 4) {
          apiKeys[provider] = "••••••••" + decrypted.slice(-4);
        } else if (decrypted) {
          apiKeys[provider] = "••••••••";
        }
      }
    }

    return NextResponse.json({ apiKeys });
  } catch (error: any) {
    console.error("Error fetching API keys:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch API keys" },
      { status: 500 },
    );
  }
}
