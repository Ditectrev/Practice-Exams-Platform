import { NextRequest, NextResponse } from "next/server";

// Mock user data - replace with your actual database
const mockUser = {
  id: "user_123",
  email: "user@example.com",
  subscription: "free",
  apiKeys: {
    openai: "",
    gemini: "",
    mistral: "",
    deepseek: "",
  },
  preferences: {
    explanationProvider: "ollama",
  },
};

export async function GET(request: NextRequest) {
  try {
    // TODO: Get user from authentication context
    // const user = await getCurrentUser(request);

    // For now, return mock data
    return NextResponse.json(mockUser);
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
