import { getAIProvider, checkProviderAvailability } from "./ai-providers";

export interface ExplanationRequest {
  question: string;
  correctAnswers: string[];
  userSubscription: string;
  userPreferences: {
    explanationProvider: string;
  };
  userApiKeys: {
    openai?: string;
    gemini?: string;
    mistral?: string;
    deepseek?: string;
  };
}

export class ExplanationService {
  async generateExplanation(request: ExplanationRequest): Promise<string> {
    const {
      question,
      correctAnswers,
      userSubscription,
      userPreferences,
      userApiKeys,
    } = request;
    const preferredProvider = userPreferences.explanationProvider;

    // Check if user can use the preferred provider
    if (!this.canUseProvider(preferredProvider, userSubscription)) {
      throw new Error(
        `Your subscription doesn't support ${preferredProvider} explanations`,
      );
    }

    // Check if provider is available
    const isAvailable = await checkProviderAvailability(preferredProvider);
    if (!isAvailable && preferredProvider === "ollama") {
      throw new Error(
        "Ollama is not running. Please start Ollama or choose a different provider.",
      );
    }

    // Get the appropriate provider
    const provider = getAIProvider(preferredProvider);

    // Generate explanation based on provider type
    if (preferredProvider === "ollama" || preferredProvider === "ditectrev") {
      return await provider.generateExplanation(question, correctAnswers);
    } else {
      // BYOK providers need API keys
      const apiKey = userApiKeys[preferredProvider as keyof typeof userApiKeys];
      if (!apiKey) {
        throw new Error(
          `Please add your ${preferredProvider} API key in your profile settings`,
        );
      }
      return await provider.generateExplanation(
        question,
        correctAnswers,
        apiKey,
      );
    }
  }

  private canUseProvider(provider: string, subscription: string): boolean {
    switch (provider) {
      case "ollama":
        return ["local", "byok", "ditectrev"].includes(subscription);
      case "openai":
      case "gemini":
      case "mistral":
      case "deepseek":
        return ["byok", "ditectrev"].includes(subscription);
      case "ditectrev":
        return subscription === "ditectrev";
      default:
        return false;
    }
  }

  getAvailableProviders(subscription: string): string[] {
    const providers = [];

    if (["local", "byok", "ditectrev"].includes(subscription)) {
      providers.push("ollama");
    }

    if (["byok", "ditectrev"].includes(subscription)) {
      providers.push("openai", "gemini", "mistral", "deepseek");
    }

    if (subscription === "ditectrev") {
      providers.push("ditectrev");
    }

    return providers;
  }
}
