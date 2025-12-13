import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { explanationProvider } = await request.json();

    // TODO: Get user from authentication context
    // const userId = await getCurrentUserId(request);

    // TODO: Update user preferences in database
    // await updateUserPreferences(userId, { explanationProvider });

    console.log("Updating explanation provider to:", explanationProvider);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 },
    );
  }
}
