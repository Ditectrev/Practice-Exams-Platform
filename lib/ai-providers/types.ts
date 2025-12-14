// Enhanced AI Provider Types and Interfaces

export enum ErrorType {
  AUTHENTICATION = 'authentication',
  RATE_LIMIT = 'rate_limit',
  NETWORK = 'network',
  VALIDATION = 'validation',
  PROVIDER_ERROR = 'provider_error',
  TIMEOUT = 'timeout',
  CONFIGURATION = 'configuration'
}

export interface APIError extends Error {
  type: ErrorType;
  provider: string;
  retryable: boolean;
  retryAfter?: number;
  originalError?: any;
  statusCode?: number;
}

export class StandardAPIError extends Error implements APIError {
  constructor(
    public type: ErrorType,
    public provider: string,
    public retryable: boolean,
    message: string,
    public retryAfter?: number,
    public originalError?: any,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'StandardAPIError';
  }
}

export interface RequestOptions {
  timeout?: number;
  maxTokens?: number;
  temperature?: number;
  model?: string;
  retryAttempts?: number;
}

export interface ExplanationRequest {
  question: string;
  correctAnswers: string[];
  context?: string;
  options?: RequestOptions;
}

export interface ResponseMetadata {
  requestId: string;
  timestamp: Date;
  processingTime: number;
  tokensUsed?: number;
  confidence?: number;
  model?: string;
  version?: string;
}

export interface ExplanationResponse {
  explanation: string;
  provider: string;
  metadata: ResponseMetadata;
}

export interface RateLimitInfo {
  requestsRemaining: number;
  resetTime: Date;
  limitType: 'minute' | 'hour' | 'day';
}

export interface ProviderHealthStatus {
  isHealthy: boolean;
  lastChecked: Date;
  responseTime: number;
  errorRate: number;
  rateLimitStatus?: RateLimitInfo;
  consecutiveFailures: number;
}

export interface ProviderConfig {
  name: string;
  enabled: boolean;
  priority: number;
  apiKey?: string;
  baseUrl?: string;
  timeout: number;
  retryAttempts: number;
  rateLimits: RateLimitConfig;
  healthCheckInterval: number;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}