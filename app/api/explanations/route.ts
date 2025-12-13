import { NextRequest, NextResponse } from "next/server";
import { ExplanationService } from "../../../lib/explanation-service";

export async function POST(request: NextRequest) {
  try {
    const { question, correctAnswers } = await request.json();

    // TODO: Get user data from authentication context
    // const userId = await getCurrentUserId(request);
    // const user = await getUser(userId);

    // Mock user data for now
    const mockUser = {
      subscription: "byok", // Change this to test different subscriptions
      preferences: {
        explanationProvider: "openai", // Change this to test different providers
      },
      apiKeys: {
        openai: "mock-key",
        gemini: "mock-key",
        mistral: "mock-key",
        deepseek: "mock-key",
      },
    };

    const explanationService = new ExplanationService();

    const explanation = await explanationService.generateExplanation({
      question,
      correctAnswers,
      userSubscription: mockUser.subscription,
      userPreferences: mockUser.preferences,
      userApiKeys: mockUser.apiKeys,
    });

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("Error generating explanation:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate explanation",
      },
      { status: 500 },
    );
  }
}
