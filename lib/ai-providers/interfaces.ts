// Enhanced AI Provider Interfaces

import {
  ExplanationRequest,
  ExplanationResponse,
  ProviderHealthStatus,
  ProviderConfig,
  ValidationResult
} from './types';

/**
 * Enhanced AIProvider interface with health monitoring and configuration validation
 * Extends the original interface with additional capabilities for production use
 */
export interface AIProvider {
  /** Provider name identifier */
  name: string;

  /** 
   * Generate explanation for a question and correct answers
   * @param request - Standardized explanation request
   * @returns Promise resolving to standardized explanation response
   */
  generateExplanation(request: ExplanationRequest): Promise<ExplanationResponse>;

  /**
   * Check if the provider is currently available and healthy
   * @returns Promise resolving to boolean indicating availability
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get current health status of the provider
   * @returns Current health status with metrics
   */
  getHealthStatus(): ProviderHealthStatus;

  /**
   * Validate the provider's configuration
   * @returns Validation result with any errors or warnings
   */
  validateConfiguration(): ValidationResult;

  /**
   * Initialize the provider with configuration
   * @param config - Provider configuration
   */
  initialize(config: ProviderConfig): Promise<void>;

  /**
   * Perform cleanup when shutting down the provider
   */
  shutdown(): Promise<void>;

  /**
   * Test connectivity to the provider's API
   * @returns Promise resolving to boolean indicating connectivity
   */
  testConnectivity(): Promise<boolean>;

  /**
   * Get provider-specific capabilities and limits
   * @returns Object describing provider capabilities
   */
  getCapabilities(): ProviderCapabilities;
}

export interface ProviderCapabilities {
  maxTokens: number;
  supportsStreaming: boolean;
  supportsBatch: boolean;
  supportedModels: string[];
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
}

/**
 * Interface for HTTP client used by providers
 */
export interface HttpClient {
  get<T>(url: string, options?: RequestInit): Promise<T>;
  post<T>(url: string, data: any, options?: RequestInit): Promise<T>;
  put<T>(url: string, data: any, options?: RequestInit): Promise<T>;
  delete<T>(url: string, options?: RequestInit): Promise<T>;
}

/**
 * Interface for retry strategy implementation
 */
export interface RetryStrategy {
  shouldRetry(error: Error, attempt: number): boolean;
  getDelay(attempt: number): number;
  getMaxAttempts(): number;
}

/**
 * Interface for circuit breaker implementation
 */
export interface CircuitBreaker {
  execute<T>(operation: () => Promise<T>): Promise<T>;
  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  reset(): void;
}