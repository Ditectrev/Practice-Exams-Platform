import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { question, correctAnswers, apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: "Mistral API key is required" },
        { status: 400 },
      );
    }

    const prompt = `Question: ${question}\n\nCorrect answers: ${correctAnswers.join(
      ", ",
    )}\n\nPlease provide a clear and concise explanation of why these answers are correct.`;

    // TODO: Replace with actual Mistral API call
    // const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${apiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     model: 'mistral-medium',
    //     messages: [
    //       {
    //         role: 'user',
    //         content: prompt
    //       }
    //     ],
    //     max_tokens: 500,
    //   }),
    // });

    // const data = await response.json();
    // const explanation = data.choices[0].message.content;

    // Mock response for now
    const explanation = `[Mistral Mock] The correct answers ${correctAnswers.join(
      ", ",
    )} are accurate because they demonstrate a thorough understanding of the subject matter and follow established methodologies and principles.`;

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("Error with Mistral API:", error);
    return NextResponse.json(
      { error: "Failed to generate explanation" },
      { status: 500 },
    );
  }
}
