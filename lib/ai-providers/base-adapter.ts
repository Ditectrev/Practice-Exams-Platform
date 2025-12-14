// Base Provider Adapter Abstract Class

import {
  AIProvider,
  ProviderCapabilities,
  HttpClient,
  RetryStrategy,
  CircuitBreaker
} from './interfaces';
import {
  ExplanationRequest,
  ExplanationResponse,
  ProviderHealthStatus,
  ProviderConfig,
  ValidationResult,
  StandardAPIError,
  ErrorType,
  ResponseMetadata
} from './types';

/**
 * Abstract base class for AI provider adapters
 * Provides common functionality and enforces consistent implementation patterns
 */
export abstract class BaseProviderAdapter implements AIProvider {
  protected config!: ProviderConfig;
  protected httpClient: HttpClient;
  protected retryStrategy: RetryStrategy;
  protected circuitBreaker: CircuitBreaker;
  protected healthStatus: ProviderHealthStatus;
  protected isInitialized = false;

  constructor(
    public readonly name: string,
    httpClient: HttpClient,
    retryStrategy: RetryStrategy,
    circuitBreaker: CircuitBreaker
  ) {
    this.httpClient = httpClient;
    this.retryStrategy = retryStrategy;
    this.circuitBreaker = circuitBreaker;
    this.healthStatus = this.initializeHealthStatus();
  }

  /**
   * Initialize the provider with configuration
   */
  async initialize(config: ProviderConfig): Promise<void> {
    this.config = config;
    
    // Validate configuration
    const validation = this.validateConfiguration();
    if (!validation.isValid) {
      throw new StandardAPIError(
        ErrorType.CONFIGURATION,
        this.name,
        false,
        `Configuration validation failed: ${validation.errors.join(', ')}`
      );
    }

    // Test initial connectivity
    try {
      await this.testConnectivity();
      this.updateHealthStatus(true, 0);
      this.isInitialized = true;
    } catch (error) {
      this.updateHealthStatus(false, 0, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new StandardAPIError(
        ErrorType.NETWORK,
        this.name,
        true,
        `Failed to initialize provider: ${errorMessage}`,
        undefined,
        error
      );
    }
  }

  /**
   * Generate explanation using the provider
   */
  async generateExplanation(request: ExplanationRequest): Promise<ExplanationResponse> {
    if (!this.isInitialized) {
      throw new StandardAPIError(
        ErrorType.CONFIGURATION,
        this.name,
        false,
        'Provider not initialized'
      );
    }

    // Validate request
    this.validateRequest(request);

    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      // Execute with circuit breaker and retry logic
      const result = await this.circuitBreaker.execute(async () => {
        return await this.executeWithRetry(async () => {
          const providerRequest = this.transformRequest(request);
          const providerResponse = await this.makeAPICall(providerRequest);
          return this.transformResponse(providerResponse, requestId, startTime);
        });
      });

      // Update health status on success
      const processingTime = Date.now() - startTime;
      this.updateHealthStatus(true, processingTime);

      return result;
    } catch (error) {
      // Update health status on failure
      this.updateHealthStatus(false, Date.now() - startTime, error);
      
      // Re-throw as standardized error
      if (error instanceof StandardAPIError) {
        throw error;
      }
      
      throw this.createStandardError(error);
    }
  }

  /**
   * Check if provider is available
   */
  async isAvailable(): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      await this.testConnectivity();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current health status
   */
  getHealthStatus(): ProviderHealthStatus {
    return { ...this.healthStatus };
  }

  /**
   * Validate provider configuration
   */
  validateConfiguration(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.config) {
      errors.push('Configuration is required');
      return { isValid: false, errors, warnings };
    }

    // Common validation rules
    if (!this.config.name) {
      errors.push('Provider name is required');
    }

    if (this.config.timeout <= 0) {
      errors.push('Timeout must be positive');
    }

    if (this.config.retryAttempts < 0) {
      errors.push('Retry attempts cannot be negative');
    }

    // Provider-specific validation
    const providerValidation = this.validateProviderSpecificConfig();
    errors.push(...providerValidation.errors);
    warnings.push(...providerValidation.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Test connectivity to provider API
   */
  async testConnectivity(): Promise<boolean> {
    try {
      await this.performHealthCheck();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Shutdown the provider
   */
  async shutdown(): Promise<void> {
    this.isInitialized = false;
    // Perform any cleanup operations
    await this.performCleanup();
  }

  /**
   * Get provider capabilities
   */
  abstract getCapabilities(): ProviderCapabilities;

  // Protected abstract methods that must be implemented by concrete providers
  protected abstract transformRequest(request: ExplanationRequest): any;
  protected abstract transformResponse(response: any, requestId: string, startTime: number): ExplanationResponse;
  protected abstract makeAPICall(request: any): Promise<any>;
  protected abstract validateProviderSpecificConfig(): ValidationResult;
  protected abstract performHealthCheck(): Promise<void>;
  protected abstract performCleanup(): Promise<void>;

  // Protected utility methods
  protected validateRequest(request: ExplanationRequest): void {
    if (!request.question?.trim()) {
      throw new StandardAPIError(
        ErrorType.VALIDATION,
        this.name,
        false,
        'Question is required and cannot be empty'
      );
    }

    if (!request.correctAnswers || request.correctAnswers.length === 0) {
      throw new StandardAPIError(
        ErrorType.VALIDATION,
        this.name,
        false,
        'At least one correct answer is required'
      );
    }
  }

  protected generateRequestId(): string {
    return `${this.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  protected createResponseMetadata(requestId: string, startTime: number): ResponseMetadata {
    return {
      requestId,
      timestamp: new Date(),
      processingTime: Date.now() - startTime
    };
  }

  protected createStandardError(error: any): StandardAPIError {
    if (error.name === 'AbortError' || error.code === 'TIMEOUT') {
      return new StandardAPIError(
        ErrorType.TIMEOUT,
        this.name,
        true,
        'Request timeout',
        undefined,
        error
      );
    }

    if (error.status === 401 || error.status === 403) {
      return new StandardAPIError(
        ErrorType.AUTHENTICATION,
        this.name,
        false,
        'Authentication failed',
        undefined,
        error,
        error.status
      );
    }

    if (error.status === 429) {
      return new StandardAPIError(
        ErrorType.RATE_LIMIT,
        this.name,
        true,
        'Rate limit exceeded',
        error.retryAfter,
        error,
        error.status
      );
    }

    if (error.status >= 500) {
      return new StandardAPIError(
        ErrorType.PROVIDER_ERROR,
        this.name,
        true,
        'Provider server error',
        undefined,
        error,
        error.status
      );
    }

    return new StandardAPIError(
      ErrorType.PROVIDER_ERROR,
      this.name,
      false,
      error.message || 'Unknown provider error',
      undefined,
      error
    );
  }

  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | unknown;
    const maxAttempts = this.retryStrategy.getMaxAttempts();

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const errorToCheck = error instanceof Error ? error : new Error(String(error));

        if (!this.retryStrategy.shouldRetry(errorToCheck, attempt) || attempt === maxAttempts) {
          throw error;
        }

        const delay = this.retryStrategy.getDelay(attempt);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private initializeHealthStatus(): ProviderHealthStatus {
    return {
      isHealthy: false,
      lastChecked: new Date(),
      responseTime: 0,
      errorRate: 0,
      consecutiveFailures: 0
    };
  }

  private updateHealthStatus(success: boolean, responseTime: number, error?: any): void {
    this.healthStatus.lastChecked = new Date();
    this.healthStatus.responseTime = responseTime;
    this.healthStatus.isHealthy = success;

    if (success) {
      this.healthStatus.consecutiveFailures = 0;
    } else {
      this.healthStatus.consecutiveFailures++;
    }

    // Update error rate (simple moving average)
    const currentErrorRate = this.healthStatus.errorRate;
    this.healthStatus.errorRate = success 
      ? currentErrorRate * 0.9 
      : Math.min(1.0, currentErrorRate * 0.9 + 0.1);
  }
}