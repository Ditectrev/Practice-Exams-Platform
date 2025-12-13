import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { question, correctAnswers, apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: "DeepSeek API key is required" },
        { status: 400 },
      );
    }

    const prompt = `Question: ${question}\n\nCorrect answers: ${correctAnswers.join(
      ", ",
    )}\n\nPlease provide a clear and concise explanation of why these answers are correct.`;

    // TODO: Replace with actual DeepSeek API call
    // const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${apiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     model: 'deepseek-chat',
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
    const explanation = `[DeepSeek Mock] Analysis of the correct answers: ${correctAnswers.join(
      ", ",
    )}. These selections are optimal because they represent the most logical and evidence-based approach to solving this type of problem.`;

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("Error with DeepSeek API:", error);
    return NextResponse.json(
      { error: "Failed to generate explanation" },
      { status: 500 },
    );
  }
}
