# Implementation Plan

- [x] 1. Enhance existing provider interfaces
  - Add optional isAvailable() and validateConfig() methods to AIProvider interface
  - Create AIProviderError class for consistent error handling
  - Add basic validation and error handling to all existing providers
  - _Requirements: 2.1, 2.2, 3.1, 3.2_

- [x] 2. Implement direct OpenAI API integration
  - Replace proxy API call with direct OpenAI API call to https://api.openai.com/v1/chat/completions
  - Add proper request formatting for OpenAI's chat completions API
  - Implement OpenAI-specific error handling (rate limits, authentication, etc.)
  - _Requirements: 1.1, 2.1, 4.1_

- [x] 3. Implement direct Gemini API integration  
  - Replace proxy API call with direct Google Gemini API call
  - Add proper request formatting for Gemini's API structure
  - Implement Gemini-specific error handling and response parsing
  - _Requirements: 1.2, 2.2, 4.2_

- [ ] 4. Implement direct Mistral API integration
  - Replace proxy API call with direct Mistral API call
  - Add proper request formatting for Mistral's API structure  
  - Implement Mistral-specific error handling and response parsing
  - _Requirements: 1.3, 2.3, 4.3_

- [ ] 5. Implement direct DeepSeek API integration
  - Replace proxy API call with direct DeepSeek API call
  - Add proper request formatting for DeepSeek's API structure
  - Implement DeepSeek-specific error handling and response parsing  
  - _Requirements: 1.4, 2.4, 4.4_

- [ ] 6. Test and validate all provider integrations
  - Test each provider with real API calls (using test API keys)
  - Validate error handling for common scenarios (invalid keys, rate limits, network errors)
  - Ensure backward compatibility with existing code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 7. Update availability checking
  - Enhance checkProviderAvailability function to work with direct API calls
  - Add proper API key validation for each provider
  - Test Ollama connectivity checking
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 8. Remove proxy API routes (optional cleanup)
  - Remove /api/ai/openai, /api/ai/gemini, /api/ai/mistral, /api/ai/deepseek routes
  - Update any remaining code that might reference these routes
  - Clean up unused API route files
  - _Requirements: 1.1, 1.2, 1.3, 1.4_