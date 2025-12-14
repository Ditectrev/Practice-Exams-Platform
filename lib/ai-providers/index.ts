// Enhanced AI Providers - Main Export File

// Export all types and interfaces
export * from './types';
export * from './interfaces';
export * from './base-adapter';

// Re-export legacy interface for backward compatibility
export interface LegacyAIProvider {
  name: string;
  generateExplanation(
    question: string,
    correctAnswers: string[],
    apiKey?: string,
  ): Promise<string>;
}

// Utility function to check if a provider implements the enhanced interface
export function isEnhancedProvider(provider: any): provider is import('./interfaces').AIProvider {
  return (
    typeof provider.isAvailable === 'function' &&
    typeof provider.getHealthStatus === 'function' &&
    typeof provider.validateConfiguration === 'function' &&
    typeof provider.initialize === 'function'
  );
}

// Utility function to check if a provider implements the legacy interface
export function isLegacyProvider(provider: any): provider is LegacyAIProvider {
  return (
    typeof provider.name === 'string' &&
    typeof provider.generateExplanation === 'function' &&
    !isEnhancedProvider(provider)
  );
}