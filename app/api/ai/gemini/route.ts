import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { question, correctAnswers, apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is required" },
        { status: 400 },
      );
    }

    const prompt = `Question: ${question}\n\nCorrect answers: ${correctAnswers.join(
      ", ",
    )}\n\nPlease provide a clear and concise explanation of why these answers are correct.`;

    // TODO: Replace with actual Gemini API call
    // const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     contents: [{
    //       parts: [{
    //         text: prompt
    //       }]
    //     }]
    //   }),
    // });

    // const data = await response.json();
    // const explanation = data.candidates[0].content.parts[0].text;

    // Mock response for now
    const explanation = `[Gemini Mock] Here's a comprehensive explanation for the correct answers: ${correctAnswers.join(
      ", ",
    )}. These answers are correct because they align with the fundamental principles and best practices in this domain.`;

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("Error with Gemini API:", error);
    return NextResponse.json(
      { error: "Failed to generate explanation" },
      { status: 500 },
    );
  }
}
