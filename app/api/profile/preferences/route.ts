import { NextRequest, NextResponse } from "next/server";
import { Client, Databases, Query } from "node-appwrite";

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
    const { explanationProvider, userId, email } = await request.json();

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

    // Validate provider
    const validProviders = [
      "ollama",
      "openai",
      "gemini",
      "mistral",
      "deepseek",
      "ditectrev",
    ];
    if (!validProviders.includes(explanationProvider)) {
      return NextResponse.json(
        { error: "Invalid explanation provider" },
        { status: 400 },
      );
    }

    const databases = getAppwriteClient();

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
        { explanation_provider: explanationProvider },
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
          explanation_provider: explanationProvider,
        },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating preferences:", error.message);
    return NextResponse.json(
      { error: "Failed to update preferences" },
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
      return NextResponse.json({
        preferences: { explanationProvider: "ollama" },
      });
    }

    const databases = getAppwriteClient();

    const users = await databases.listDocuments(
      DATABASE_ID,
      API_KEYS_COLLECTION_ID,
      [Query.equal("appwrite_user_id", userId)],
    );

    if (users.documents.length === 0) {
      return NextResponse.json({
        preferences: { explanationProvider: "ollama" },
      });
    }

    const user = users.documents[0];

    return NextResponse.json({
      preferences: {
        explanationProvider: user.explanation_provider || "ollama",
      },
    });
  } catch (error: any) {
    console.error("Error fetching preferences:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 },
    );
  }
}
