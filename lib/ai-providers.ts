// AI Provider abstraction layer
export interface AIProvider {
  name: string;
  generateExplanation(
    question: string,
    correctAnswers: string[],
    apiKey?: string,
  ): Promise<string>;
  isAvailable?(): Promise<boolean>;
  validateConfig?(apiKey?: string): boolean;
}

// Enhanced request options
export interface RequestOptions {
  timeout?: number;
  retryAttempts?: number;
}

// Standardized error types
export class AIProviderError extends Error {
  constructor(
    public provider: string,
    public type: 'network' | 'auth' | 'rate_limit' | 'validation' | 'timeout',
    message: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}

export class OllamaProvider implements AIProvider {
  name = "ollama";

  async generateExplanation(
    question: string,
    correctAnswers: string[],
  ): Promise<string> {
    this.validateRequest(question, correctAnswers);

    const prompt = `${question} Explain why these answers are correct: ${correctAnswers.join(
      ", ",
    )}`;

    try {
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
        throw new AIProviderError(
          this.name,
          response.status === 401 ? 'auth' : 'network',
          `Ollama API error: ${response.status}`
        );
      }

      const data = await response.json();
      
      if (!data.response) {
        throw new AIProviderError(this.name, 'validation', 'Invalid response from Ollama');
      }

      return data.response;
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new AIProviderError(this.name, 'network', `Ollama connection failed: ${errorMessage}`, error);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch("http://localhost:11434/api/tags");
      return response.ok;
    } catch {
      return false;
    }
  }

  validateConfig(): boolean {
    return true; // Ollama doesn't need API key
  }

  private validateRequest(question: string, correctAnswers: string[]): void {
    if (!question?.trim()) {
      throw new AIProviderError(this.name, 'validation', 'Question cannot be empty');
    }
    if (!correctAnswers?.length) {
      throw new AIProviderError(this.name, 'validation', 'At least one correct answer is required');
    }
  }
}

export class OpenAIProvider implements AIProvider {
  name = "openai";

  async generateExplanation(
    question: string,
    correctAnswers: string[],
    apiKey: string,
  ): Promise<string> {
    this.validateRequest(question, correctAnswers, apiKey);

    try {
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
        const errorType = response.status === 401 ? 'auth' : 
                         response.status === 429 ? 'rate_limit' : 'network';
        throw new AIProviderError(this.name, errorType, `OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.explanation) {
        throw new AIProviderError(this.name, 'validation', 'Invalid response from OpenAI');
      }

      return data.explanation;
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new AIProviderError(this.name, 'network', `OpenAI request failed: ${errorMessage}`, error);
    }
  }

  async isAvailable(): Promise<boolean> {
    return true; // API-based, assume available if we have a key
  }

  validateConfig(apiKey?: string): boolean {
    return !!(apiKey && apiKey.startsWith('sk-') && apiKey.length > 20);
  }

  private validateRequest(question: string, correctAnswers: string[], apiKey: string): void {
    if (!question?.trim()) {
      throw new AIProviderError(this.name, 'validation', 'Question cannot be empty');
    }
    if (!correctAnswers?.length) {
      throw new AIProviderError(this.name, 'validation', 'At least one correct answer is required');
    }
    if (!this.validateConfig(apiKey)) {
      throw new AIProviderError(this.name, 'auth', 'Invalid OpenAI API key format');
    }
  }
}

export class GeminiProvider implements AIProvider {
  name = "gemini";

  async generateExplanation(
    question: string,
    correctAnswers: string[],
    apiKey: string,
  ): Promise<string> {
    this.validateRequest(question, correctAnswers, apiKey);

    try {
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
        const errorType = response.status === 401 ? 'auth' : 
                         response.status === 429 ? 'rate_limit' : 'network';
        throw new AIProviderError(this.name, errorType, `Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.explanation) {
        throw new AIProviderError(this.name, 'validation', 'Invalid response from Gemini');
      }

      return data.explanation;
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new AIProviderError(this.name, 'network', `Gemini request failed: ${errorMessage}`, error);
    }
  }

  async isAvailable(): Promise<boolean> {
    return true; // API-based, assume available if we have a key
  }

  validateConfig(apiKey?: string): boolean {
    return !!(apiKey && apiKey.length > 10); // Basic validation for Gemini keys
  }

  private validateRequest(question: string, correctAnswers: string[], apiKey: string): void {
    if (!question?.trim()) {
      throw new AIProviderError(this.name, 'validation', 'Question cannot be empty');
    }
    if (!correctAnswers?.length) {
      throw new AIProviderError(this.name, 'validation', 'At least one correct answer is required');
    }
    if (!this.validateConfig(apiKey)) {
      throw new AIProviderError(this.name, 'auth', 'Invalid Gemini API key');
    }
  }
}

export class MistralProvider implements AIProvider {
  name = "mistral";

  async generateExplanation(
    question: string,
    correctAnswers: string[],
    apiKey: string,
  ): Promise<string> {
    this.validateRequest(question, correctAnswers, apiKey);

    try {
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
        const errorType = response.status === 401 ? 'auth' : 
                         response.status === 429 ? 'rate_limit' : 'network';
        throw new AIProviderError(this.name, errorType, `Mistral API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.explanation) {
        throw new AIProviderError(this.name, 'validation', 'Invalid response from Mistral');
      }

      return data.explanation;
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new AIProviderError(this.name, 'network', `Mistral request failed: ${errorMessage}`, error);
    }
  }

  async isAvailable(): Promise<boolean> {
    return true; // API-based, assume available if we have a key
  }

  validateConfig(apiKey?: string): boolean {
    return !!(apiKey && apiKey.length > 10); // Basic validation for Mistral keys
  }

  private validateRequest(question: string, correctAnswers: string[], apiKey: string): void {
    if (!question?.trim()) {
      throw new AIProviderError(this.name, 'validation', 'Question cannot be empty');
    }
    if (!correctAnswers?.length) {
      throw new AIProviderError(this.name, 'validation', 'At least one correct answer is required');
    }
    if (!this.validateConfig(apiKey)) {
      throw new AIProviderError(this.name, 'auth', 'Invalid Mistral API key');
    }
  }
}

export class DeepSeekProvider implements AIProvider {
  name = "deepseek";

  async generateExplanation(
    question: string,
    correctAnswers: string[],
    apiKey: string,
  ): Promise<string> {
    this.validateRequest(question, correctAnswers, apiKey);

    try {
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
        const errorType = response.status === 401 ? 'auth' : 
                         response.status === 429 ? 'rate_limit' : 'network';
        throw new AIProviderError(this.name, errorType, `DeepSeek API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.explanation) {
        throw new AIProviderError(this.name, 'validation', 'Invalid response from DeepSeek');
      }

      return data.explanation;
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new AIProviderError(this.name, 'network', `DeepSeek request failed: ${errorMessage}`, error);
    }
  }

  async isAvailable(): Promise<boolean> {
    return true; // API-based, assume available if we have a key
  }

  validateConfig(apiKey?: string): boolean {
    return !!(apiKey && apiKey.length > 10); // Basic validation for DeepSeek keys
  }

  private validateRequest(question: string, correctAnswers: string[], apiKey: string): void {
    if (!question?.trim()) {
      throw new AIProviderError(this.name, 'validation', 'Question cannot be empty');
    }
    if (!correctAnswers?.length) {
      throw new AIProviderError(this.name, 'validation', 'At least one correct answer is required');
    }
    if (!this.validateConfig(apiKey)) {
      throw new AIProviderError(this.name, 'auth', 'Invalid DeepSeek API key');
    }
  }
}

export class DitectrevProvider implements AIProvider {
  name = "ditectrev";

  async generateExplanation(
    question: string,
    correctAnswers: string[],
  ): Promise<string> {
    this.validateRequest(question, correctAnswers);

    try {
      const response = await fetch("/api/ai/ditectrev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          correctAnswers,
        }),
      });

      if (!response.ok) {
        const errorType = response.status === 401 ? 'auth' : 
                         response.status === 429 ? 'rate_limit' : 'network';
        throw new AIProviderError(this.name, errorType, `Ditectrev API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.explanation) {
        throw new AIProviderError(this.name, 'validation', 'Invalid response from Ditectrev');
      }

      return data.explanation;
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new AIProviderError(this.name, 'network', `Ditectrev request failed: ${errorMessage}`, error);
    }
  }

  async isAvailable(): Promise<boolean> {
    return true; // Internal service, assume available
  }

  validateConfig(): boolean {
    return true; // Ditectrev doesn't need API key
  }

  private validateRequest(question: string, correctAnswers: string[]): void {
    if (!question?.trim()) {
      throw new AIProviderError(this.name, 'validation', 'Question cannot be empty');
    }
    if (!correctAnswers?.length) {
      throw new AIProviderError(this.name, 'validation', 'At least one correct answer is required');
    }
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
  apiKey?: string,
): Promise<boolean> {
  try {
    const provider = getAIProvider(providerName);
    
    // Check config validation if provider supports it
    if (provider.validateConfig && !provider.validateConfig(apiKey)) {
      return false;
    }
    
    // Check availability if provider supports it
    if (provider.isAvailable) {
      return await provider.isAvailable();
    }
    
    return true;
  } catch {
    return false;
  }
}

// Simple retry utility for providers
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on validation or auth errors
      if (error instanceof AIProviderError && 
          (error.type === 'validation' || error.type === 'auth')) {
        throw error;
      }
      
      if (attempt === maxAttempts) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError!;
}
