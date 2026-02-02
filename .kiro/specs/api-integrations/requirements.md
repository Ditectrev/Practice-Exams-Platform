# Requirements Document

## Introduction

This feature focuses on enhancing the existing AI provider system to make direct API calls to external AI services (OpenAI, Gemini, Mistral, DeepSeek) while maintaining the current simple architecture. The goal is to replace the current proxy API routes with direct provider calls, add basic error handling and validation, while keeping the system lightweight and maintainable.

## Requirements

### Requirement 1

**User Story:** As a developer, I want to make direct API calls to AI providers instead of going through proxy routes, so that I can reduce complexity and improve performance.

#### Acceptance Criteria

1. WHEN calling OpenAI THEN the system SHALL make direct calls to OpenAI's API using the provided API key
2. WHEN calling Gemini THEN the system SHALL make direct calls to Google's Gemini API using the provided API key  
3. WHEN calling Mistral THEN the system SHALL make direct calls to Mistral's API using the provided API key
4. WHEN calling DeepSeek THEN the system SHALL make direct calls to DeepSeek's API using the provided API key

### Requirement 2

**User Story:** As a developer, I want basic input validation and error handling, so that the system fails gracefully with clear error messages.

#### Acceptance Criteria

1. WHEN a question is empty THEN the system SHALL return a validation error
2. WHEN no correct answers are provided THEN the system SHALL return a validation error
3. WHEN an API key is invalid format THEN the system SHALL return an authentication error
4. WHEN an API call fails THEN the system SHALL return a descriptive error message

### Requirement 3

**User Story:** As a developer, I want to maintain the existing simple provider interface, so that existing code continues to work without changes.

#### Acceptance Criteria

1. WHEN using the existing AIProvider interface THEN all current functionality SHALL continue to work
2. WHEN calling generateExplanation THEN the method signature SHALL remain the same
3. WHEN getting a provider by name THEN the factory function SHALL continue to work
4. WHEN checking provider availability THEN the existing function SHALL continue to work

### Requirement 4

**User Story:** As a developer, I want proper API key validation, so that I can catch configuration issues early.

#### Acceptance Criteria

1. WHEN an OpenAI API key is provided THEN the system SHALL validate it starts with 'sk-' and has reasonable length
2. WHEN a Gemini API key is provided THEN the system SHALL validate it has reasonable length
3. WHEN a Mistral API key is provided THEN the system SHALL validate it has reasonable length  
4. WHEN a DeepSeek API key is provided THEN the system SHALL validate it has reasonable length

### Requirement 5

**User Story:** As a developer, I want to check if providers are available, so that I can handle offline scenarios gracefully.

#### Acceptance Criteria

1. WHEN checking Ollama availability THEN the system SHALL ping localhost:11434
2. WHEN checking API-based providers THEN the system SHALL validate API keys are present
3. WHEN a provider is unavailable THEN the system SHALL return false from availability check
4. WHEN Ditectrev is checked THEN the system SHALL always return available (internal service)

