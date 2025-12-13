// AI Provider abstraction layer
export interface AIProvider {
  name: string;
  generateExplanation(
    question: string,
    correctAnswers: string[],
    apiKey?: string,
  ): Promise<string>;
}

export class OllamaProvider implements AIProvider {
  name = "ollama";

  async generateExplanation(
    question: string,
    correctAnswers: string[],
  ): Promise<string> {
    const prompt = `${question} Explain why these answers are correct: ${correctAnswers.join(
      ", ",
    )}`;

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "mistral",
        prompt: prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  }
}

export class OpenAIProvider implements AIProvider {
  name = "openai";

  async generateExplanation(
    question: string,
    correctAnswers: string[],
    apiKey: string,
  ): Promise<string> {
    const response = await fetch("/api/ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        correctAnswers,
        apiKey,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.explanation;
  }
}

export class GeminiProvider implements AIProvider {
  name = "gemini";

  async generateExplanation(
    question: string,
    correctAnswers: string[],
    apiKey: string,
  ): Promise<string> {
    const response = await fetch("/api/ai/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        correctAnswers,
        apiKey,
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.explanation;
  }
}

export class MistralProvider implements AIProvider {
  name = "mistral";

  async generateExplanation(
    question: string,
    correctAnswers: string[],
    apiKey: string,
  ): Promise<string> {
    const response = await fetch("/api/ai/mistral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        correctAnswers,
        apiKey,
      }),
    });

    if (!response.ok) {
      throw new Error(`Mistral API error: ${response.status}`);
    }

    const data = await response.json();
    return data.explanation;
  }
}

export class DeepSeekProvider implements AIProvider {
  name = "deepseek";

  async generateExplanation(
    question: string,
    correctAnswers: string[],
    apiKey: string,
  ): Promise<string> {
    const response = await fetch("/api/ai/deepseek", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        correctAnswers,
        apiKey,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    return data.explanation;
  }
}

export class DitectrevProvider implements AIProvider {
  name = "ditectrev";

  async generateExplanation(
    question: string,
    correctAnswers: string[],
  ): Promise<string> {
    const response = await fetch("/api/ai/ditectrev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        correctAnswers,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ditectrev API error: ${response.status}`);
    }

    const data = await response.json();
    return data.explanation;
  }
}

// Factory function to get the appropriate provider
export function getAIProvider(providerName: string): AIProvider {
  switch (providerName) {
    case "ollama":
      return new OllamaProvider();
    case "openai":
      return new OpenAIProvider();
    case "gemini":
      return new GeminiProvider();
    case "mistral":
      return new MistralProvider();
    case "deepseek":
      return new DeepSeekProvider();
    case "ditectrev":
      return new DitectrevProvider();
    default:
      throw new Error(`Unknown AI provider: ${providerName}`);
  }
}

// Check if a provider is available
export async function checkProviderAvailability(
  providerName: string,
): Promise<boolean> {
  switch (providerName) {
    case "ollama":
      try {
        const response = await fetch("http://localhost:11434");
        return response.ok;
      } catch {
        return false;
      }
    case "openai":
    case "gemini":
    case "mistral":
    case "deepseek":
      // These require API keys, so we'll check during usage
      return true;
    case "ditectrev":
      // Always available for premium users
      return true;
    default:
      return false;
  }
}
