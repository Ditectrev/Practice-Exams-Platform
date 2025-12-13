# AI Explanations Feature

This document describes the new AI-powered explanations feature with multiple providers and subscription tiers.

## 🚀 Features

### Multi-Provider AI Support

- **Ollama** - Local AI explanations (privacy-focused)
- **OpenAI GPT** - Industry-leading AI with your API key
- **Google Gemini** - Google's advanced AI model
- **Mistral AI** - European AI excellence
- **DeepSeek** - Cutting-edge reasoning AI
- **Ditectrev Premium** - Our managed AI service

### Subscription Tiers

#### 1. Ads Free (€1.99/month)

- Remove all advertisements
- Access to all practice questions
- Progress tracking

#### 2. Local Explanations (€2.99/month)

- Everything in Ads Free
- Ollama-powered explanations
- Complete privacy (runs locally)
- No API costs

#### 3. BYOK Explanations (€4.99/month) 🌟 Most Popular

- Everything in Local
- Bring Your Own API Keys
- Access to OpenAI, Gemini, Mistral, DeepSeek
- API key management interface
- Multiple provider options

#### 4. Ditectrev Explanations (€9.99/month)

- Everything in BYOK
- Premium AI models with our infrastructure
- No API key management required
- Unlimited explanations
- Priority support
- Advanced AI features

## 🛠 Technical Implementation

### Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   QuizForm      │───▶│ ExplanationService│───▶│  AI Providers   │
│   Component     │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │ User Profile     │    │ API Routes      │
                       │ & Preferences    │    │ (/api/ai/*)     │
                       └──────────────────┘    └─────────────────┘
```

### Key Components

#### 1. AI Provider Abstraction (`lib/ai-providers.ts`)

- Unified interface for all AI providers
- Factory pattern for provider selection
- Error handling and availability checking

#### 2. Explanation Service (`lib/explanation-service.ts`)

- Business logic for explanation generation
- Subscription tier validation
- Provider availability checking

#### 3. User Profile Management (`app/profile/page.tsx`)

- API key management interface
- Provider preference selection
- Subscription status display

#### 4. Pricing Page (`app/pricing/page.tsx`)

- Subscription tier comparison
- Stripe checkout integration
- Feature explanations

### API Routes

- `POST /api/explanations` - Generate explanations
- `GET /api/profile` - Get user profile
- `POST /api/profile/api-keys` - Save API keys
- `POST /api/profile/preferences` - Update preferences
- `POST /api/stripe/create-checkout-session` - Stripe checkout
- `POST /api/ai/{provider}` - Provider-specific endpoints

## 🔧 Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# AI Provider Keys (for Ditectrev premium service)
DITECTREV_OPENAI_KEY=sk-...
DITECTREV_GEMINI_KEY=...
DITECTREV_MISTRAL_KEY=...
DITECTREV_DEEPSEEK_KEY=...

# App Configuration
NEXT_PUBLIC_URL=http://localhost:3000
```

### 2. Database Setup

Implement the database schema from `lib/database-schema.md`:

- Users table with subscription information
- API keys table (encrypted)
- User preferences
- Subscription tracking

### 3. Stripe Configuration

1. Create products and prices in Stripe Dashboard
2. Set up webhooks for subscription events
3. Configure price IDs in the pricing page

### 4. AI Provider Setup

Each provider requires different setup:

#### Ollama (Local)

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull mistral
```

#### OpenAI

- Get API key from https://platform.openai.com/
- Users add their key in profile settings

#### Google Gemini

- Get API key from Google AI Studio
- Users add their key in profile settings

#### Mistral AI

- Get API key from https://console.mistral.ai/
- Users add their key in profile settings

#### DeepSeek

- Get API key from https://platform.deepseek.com/
- Users add their key in profile settings

## 🔒 Security Considerations

### API Key Management

- All user API keys are encrypted before storage
- Keys are never logged or exposed in responses
- Implement proper access controls

### Rate Limiting

- Implement per-user rate limiting
- Different limits per subscription tier
- Prevent abuse of AI services

### Data Privacy

- Ollama runs completely locally
- Other providers: data sent to respective APIs
- Clear privacy policy for each provider

## 🚀 Usage

### For Users

1. **Sign up** and choose a subscription tier
2. **Configure** AI provider in profile settings
3. **Add API keys** if using BYOK tier
4. **Take quizzes** and click "Explain" for AI-powered explanations

### For Developers

```typescript
// Generate explanation
const service = new ExplanationService();
const explanation = await service.generateExplanation({
  question: "What is React?",
  correctAnswers: ["A JavaScript library"],
  userSubscription: "byok",
  userPreferences: { explanationProvider: "openai" },
  userApiKeys: { openai: "sk-..." },
});
```

## 📊 Analytics & Monitoring

Track key metrics:

- Explanation usage per provider
- Subscription conversion rates
- API costs and usage patterns
- User satisfaction with explanations

## 🔄 Future Enhancements

1. **Caching System** - Cache explanations to reduce costs
2. **Custom Models** - Fine-tuned models for specific domains
3. **Explanation History** - Save and review past explanations
4. **Collaborative Features** - Share explanations with others
5. **Mobile App Integration** - Sync with iOS/Android apps

## 🐛 Troubleshooting

### Common Issues

1. **Ollama not available**

   - Ensure Ollama is installed and running
   - Check if port 11434 is accessible

2. **API key errors**

   - Verify API keys are correctly entered
   - Check API key permissions and quotas

3. **Subscription issues**
   - Verify Stripe webhook configuration
   - Check subscription status in Stripe Dashboard

### Debug Mode

Set `NODE_ENV=development` to enable detailed logging and mock responses for testing.

## 📞 Support

For technical support or questions:

- Check the troubleshooting section above
- Review the database schema and API documentation
- Contact the development team

---

Built with ❤️ by the Ditectrev team
