import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { question, correctAnswers, apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key is required" },
        { status: 400 },
      );
    }

    const prompt = `Question: ${question}\n\nCorrect answers: ${correctAnswers.join(
      ", ",
    )}\n\nPlease provide a clear and concise explanation of why these answers are correct. Focus on the key concepts and reasoning.`;

    // TODO: Replace with actual OpenAI API call
    // const response = await fetch('https://api.openai.com/v1/chat/completions', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${apiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     model: 'gpt-3.5-turbo',
    //     messages: [
    //       {
    //         role: 'user',
    //         content: prompt
    //       }
    //     ],
    //     max_tokens: 500,
    //     temperature: 0.7,
    //   }),
    // });

    // const data = await response.json();
    // const explanation = data.choices[0].message.content;

    // Mock response for now
    const explanation = `[OpenAI Mock] This is a detailed explanation of why the correct answers are: ${correctAnswers.join(
      ", ",
    )}. The reasoning involves understanding the core concepts and applying logical thinking to arrive at these conclusions.`;

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("Error with OpenAI API:", error);
    return NextResponse.json(
      { error: "Failed to generate explanation" },
      { status: 500 },
    );
  }
}
