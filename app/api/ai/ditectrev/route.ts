import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { question, correctAnswers } = await request.json();

    const apiKey = process.env.DITECTREV_AI_KEY;
    if (!apiKey) {
      console.error("DITECTREV_AI_KEY not configured");
      return NextResponse.json(
        { error: "Ditectrev AI service not configured" },
        { status: 500 },
      );
    }

    const prompt = `Question: ${question}\n\nCorrect answers: ${correctAnswers.join(
      ", ",
    )}\n\nPlease provide a detailed, expert-level explanation of why these answers are correct. Focus on the key concepts and reasoning that make these the correct choices.`;

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-medium",
        messages: [
          {
            role: "system",
            content:
              "You are an expert educator providing detailed explanations for exam questions. Provide comprehensive, accurate, and pedagogically sound explanations.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 800,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Mistral API error:", response.status, errorData);
      return NextResponse.json(
        { error: "Failed to generate explanation" },
        { status: 500 },
      );
    }

    const data = await response.json();
    const explanation = data.choices?.[0]?.message?.content;

    if (!explanation) {
      console.error("No explanation in Mistral response:", data);
      return NextResponse.json(
        { error: "Invalid response from AI service" },
        { status: 500 },
      );
    }

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("Error with Ditectrev AI:", error);
    return NextResponse.json(
      { error: "Failed to generate explanation" },
      { status: 500 },
    );
  }
}
