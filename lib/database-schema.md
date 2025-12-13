# Database Schema for AI Explanations Feature

## Users Table

```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  subscription_type ENUM('free', 'ads-free', 'local', 'byok', 'ditectrev') DEFAULT 'free',
  subscription_status ENUM('active', 'canceled', 'past_due') DEFAULT 'active',
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## User API Keys Table (Encrypted)

```sql
CREATE TABLE user_api_keys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  provider ENUM('openai', 'gemini', 'mistral', 'deepseek') NOT NULL,
  encrypted_api_key TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_provider (user_id, provider)
);
```

## User Preferences Table

```sql
CREATE TABLE user_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  explanation_provider ENUM('ollama', 'openai', 'gemini', 'mistral', 'deepseek', 'ditectrev') DEFAULT 'ollama',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_preferences (user_id)
);
```

## Subscriptions Table

```sql
CREATE TABLE subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_price_id VARCHAR(255) NOT NULL,
  status ENUM('active', 'canceled', 'past_due', 'unpaid') NOT NULL,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Explanation Usage Tracking (Optional)

```sql
CREATE TABLE explanation_usage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  provider ENUM('ollama', 'openai', 'gemini', 'mistral', 'deepseek', 'ditectrev') NOT NULL,
  question_hash VARCHAR(64), -- Hash of the question for deduplication
  tokens_used INT DEFAULT 0,
  cost_cents INT DEFAULT 0, -- Cost in cents
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_date (user_id, created_at),
  INDEX idx_provider_date (provider, created_at)
);
```

## Stripe Price IDs Configuration

```javascript
const STRIPE_PRICES = {
  "ads-free": "price_ads_free_monthly",
  local: "price_local_monthly",
  byok: "price_byok_monthly",
  ditectrev: "price_ditectrev_monthly",
};
```

## Implementation Notes

1. **API Key Encryption**: Use a strong encryption method (AES-256) to store user API keys
2. **Subscription Management**: Implement Stripe webhooks to handle subscription changes
3. **Usage Tracking**: Track explanation usage for analytics and billing
4. **Rate Limiting**: Implement rate limiting per subscription tier
5. **Caching**: Cache explanations to reduce API costs and improve performance

## Security Considerations

- Encrypt all API keys before storing
- Use environment variables for encryption keys
- Implement proper access controls
- Log all API key access for security auditing
- Regularly rotate encryption keys
