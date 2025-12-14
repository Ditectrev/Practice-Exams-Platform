# Enhanced AI Providers

This directory contains the enhanced AI provider system that builds upon the original provider abstraction with additional capabilities for production use.

## Key Features

- **Health Monitoring**: Continuous monitoring of provider availability and performance
- **Configuration Validation**: Comprehensive validation of provider configurations
- **Standardized Error Handling**: Consistent error types and handling across all providers
- **Retry Logic**: Built-in retry mechanisms with exponential backoff
- **Circuit Breaker**: Automatic failover when providers become unhealthy
- **Rate Limiting**: Configurable rate limiting and quota management
- **Metrics Collection**: Performance metrics and health status tracking

## Architecture

### Core Components

1. **Types** (`types.ts`): Defines all interfaces, enums, and data structures
2. **Interfaces** (`interfaces.ts`): Core interfaces including the enhanced AIProvider
3. **Base Adapter** (`base-adapter.ts`): Abstract base class with common functionality
4. **Example Provider** (`example-provider.ts`): Template implementation

### Enhanced AIProvider Interface

The enhanced `AIProvider` interface extends the original with:

```typescript
interface AIProvider {
  name: string;
  generateExplanation(request: ExplanationRequest): Promise<ExplanationResponse>;
  isAvailable(): Promise<boolean>;
  getHealthStatus(): ProviderHealthStatus;
  validateConfiguration(): ValidationResult;
  initialize(config: ProviderConfig): Promise<void>;
  shutdown(): Promise<void>;
  testConnectivity(): Promise<boolean>;
  getCapabilities(): ProviderCapabilities;
}
```

### Standardized Request/Response

All providers now use standardized request and response formats:

```typescript
interface ExplanationRequest {
  question: string;
  correctAnswers: string[];
  context?: string;
  options?: RequestOptions;
}

interface ExplanationResponse {
  explanation: string;
  provider: string;
  metadata: ResponseMetadata;
}
```

### Error Handling

Comprehensive error classification with standardized error types:

```typescript
enum ErrorType {
  AUTHENTICATION = 'authentication',
  RATE_LIMIT = 'rate_limit',
  NETWORK = 'network',
  VALIDATION = 'validation',
  PROVIDER_ERROR = 'provider_error',
  TIMEOUT = 'timeout',
  CONFIGURATION = 'configuration'
}
```

## Implementation Guide

### Creating a New Provider

1. Extend `BaseProviderAdapter`
2. Implement required abstract methods:
   - `getCapabilities()`
   - `transformRequest()`
   - `transformResponse()`
   - `makeAPICall()`
   - `validateProviderSpecificConfig()`
   - `performHealthCheck()`
   - `performCleanup()`

### Example Implementation

```typescript
export class MyProvider extends BaseProviderAdapter {
  constructor(httpClient: HttpClient, retryStrategy: RetryStrategy, circuitBreaker: CircuitBreaker) {
    super('my-provider', httpClient, retryStrategy, circuitBreaker);
  }

  getCapabilities(): ProviderCapabilities {
    return {
      maxTokens: 4096,
      supportsStreaming: true,
      supportsBatch: false,
      supportedModels: ['model-1', 'model-2'],
      rateLimits: {
        requestsPerMinute: 60,
        requestsPerHour: 1000,
        requestsPerDay: 10000
      }
    };
  }

  // Implement other required methods...
}
```

## Backward Compatibility

The enhanced system maintains backward compatibility with the original `AIProvider` interface. Legacy providers can be detected and wrapped using utility functions:

```typescript
import { isEnhancedProvider, isLegacyProvider } from './index';

if (isEnhancedProvider(provider)) {
  // Use enhanced features
  const health = provider.getHealthStatus();
} else if (isLegacyProvider(provider)) {
  // Use legacy interface
  const result = await provider.generateExplanation(question, answers, apiKey);
}
```

## Requirements Addressed

This implementation addresses the following requirements:

- **2.1**: Standardized request/response format across all providers
- **2.2**: Normalized responses to common schema
- **5.1**: Comprehensive request parameter validation
- **5.2**: Response structure validation and error handling

## Next Steps

1. Implement configuration management system (Task 2)
2. Create enhanced HTTP client with retry logic (Task 3)
3. Implement rate limiting and quota management (Task 4)
4. Build health monitoring system (Task 5)
5. Enhance existing provider implementations (Task 6)