# Stripe Subscriptions Setup Guide

This guide explains how to set up Stripe subscriptions linked to Appwrite authenticated users.

## Overview

The subscription system links Stripe subscriptions to Appwrite authenticated users using:

- **Appwrite User ID** (`$id`) - The primary identifier from Appwrite Auth
- **Subscriptions Collection** - A dedicated Appwrite collection for tracking subscriptions
- **Stripe Metadata** - Appwrite user ID is passed in Stripe checkout session metadata

## Database Structure

### Subscriptions Collection

The `subscriptions` collection stores subscription information linked to Appwrite users:

- `appwrite_user_id` (string, required) - Links to Appwrite Auth user `$id`
- `stripe_customer_id` (string, optional) - Stripe customer ID
- `stripe_subscription_id` (string, optional) - Stripe subscription ID (unique)
- `stripe_price_id` (string, optional) - Stripe price ID
- `subscription_type` (string, required) - One of: `free`, `ads-free`, `local`, `byok`, `ditectrev`
- `subscription_status` (string, required) - One of: `active`, `canceled`, `past_due`, `unpaid`
- `current_period_start` (integer, optional) - Unix timestamp
- `current_period_end` (integer, optional) - Unix timestamp
- `email` (string, optional) - User email (denormalized for convenience)

## Setup Instructions

### Step 1: Create the Subscriptions Collection

Run the setup script to create the subscriptions collection:

```bash
node scripts/setup-subscriptions-database.js
```

This script will:

- Use your existing database (same as trials)
- Create the `subscriptions` collection in that database
- Add all required attributes
- Create indexes for efficient queries

**Note**: Subscriptions use a **separate collection** in the same database as trials. This keeps concerns logically separated while working within database limits. If you have multiple databases available, you can set `NEXT_PUBLIC_APPWRITE_SUBSCRIPTIONS_DATABASE_ID` to use a different database.

### Step 2: Configure Permissions

In the Appwrite Console, set up collection permissions:

1. Go to your database → `subscriptions` collection → Settings
2. Set permissions:
   - **Create**: `users` (authenticated users can create their own subscriptions)
   - **Read**: `users` (users can read their own subscriptions)
   - **Update**: `users` (users can update their own subscriptions)
   - **Delete**: `users` (users can delete their own subscriptions)
3. Enable **Document Security** (this is set by the script)

**Important**: The webhook uses an API key, so it can create/update any document. Make sure your API key has the necessary permissions.

### Step 3: Verify Environment Variables

Ensure these environment variables are set:

```bash
NEXT_PUBLIC_APPWRITE_ENDPOINT=your_endpoint
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_API_KEY=your_api_key
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
```

**Optional**: If you want to use a separate database for subscriptions (if you have multiple databases available):

```bash
NEXT_PUBLIC_APPWRITE_SUBSCRIPTIONS_DATABASE_ID=your_subscriptions_database_id
```

If not set, it will use `NEXT_PUBLIC_APPWRITE_DATABASE_ID` (same database as trials, but different collection).

## How It Works

### 1. User Subscribes (Frontend)

When a user clicks "Subscribe" on the pricing page:

1. The frontend checks if the user is authenticated
2. If authenticated, it calls `/api/stripe/create-checkout-session` with:
   - `priceId` - The Stripe price ID
   - `appwriteUserId` - The Appwrite user `$id` from the auth context

### 2. Checkout Session Creation (Backend)

The API route:

1. Receives the `priceId` and `appwriteUserId`
2. Creates a Stripe checkout session
3. Includes `appwriteUserId` in the session metadata
4. Returns the checkout URL

### 3. Webhook Processing (Backend)

When Stripe sends webhook events:

#### `checkout.session.completed`

- Extracts `appwriteUserId` from session metadata
- Creates or updates a subscription record in the `subscriptions` collection
- Links the subscription to the Appwrite user by `appwrite_user_id`

#### `customer.subscription.updated`

- Finds the subscription by `stripe_subscription_id`
- Updates the subscription status and period dates

#### `customer.subscription.deleted`

- Finds the subscription by `stripe_subscription_id`
- Marks it as `canceled` and sets type to `free`

## Querying User Subscriptions

To get a user's subscription, query the `subscriptions` collection in the subscriptions database:

```typescript
import { Query } from "node-appwrite";

const SUBSCRIPTIONS_DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_SUBSCRIPTIONS_DATABASE_ID ||
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID; // Falls back to main database

// Get active subscription for a user
const subscriptions = await databases.listDocuments(
  SUBSCRIPTIONS_DATABASE_ID,
  "subscriptions",
  [
    Query.equal("appwrite_user_id", appwriteUserId),
    Query.equal("subscription_status", "active"),
  ],
);

// Get the most recent subscription
const latestSubscription = subscriptions.documents[0];
```

## Database Structure

### Separate Collections

The system uses **separate collections** for different concerns within the same database:

1. **Trials Collection** (in `NEXT_PUBLIC_APPWRITE_DATABASE_ID`)

   - Collection: `trials` (or `trials_production`)
   - Purpose: Tracking 15-minute trial sessions
   - Type: Session-based tracking (not user-based)
   - Features: Device fingerprinting and IP tracking

2. **Subscriptions Collection** (in same database, or separate if configured)
   - Collection: `subscriptions`
   - Database: `NEXT_PUBLIC_APPWRITE_SUBSCRIPTIONS_DATABASE_ID` (or falls back to main database)
   - Purpose: Long-term subscription management
   - Type: User-based tracking (linked to Appwrite Auth)
   - Features: Stripe integration, subscription lifecycle management

This separation ensures:

- Clear separation of concerns (different collections)
- Logical organization within the same database
- Easier maintenance and debugging
- Can use separate databases if available (via environment variable)

## Troubleshooting

### Subscription Not Linked to User

- **Check**: Is the user authenticated when creating the checkout session?
- **Check**: Is `appwriteUserId` being passed in the request body?
- **Check**: Is the user ID included in Stripe session metadata?

### Webhook Not Processing

- **Check**: Webhook secret is configured correctly
- **Check**: Appwrite API key has permissions to create/update documents in the subscriptions database
- **Check**: `NEXT_PUBLIC_APPWRITE_SUBSCRIPTIONS_DATABASE_ID` environment variable is set
- **Check**: Database and collection IDs are correct
- **Check**: Collection attributes match the expected schema

### User Has Multiple Subscriptions

This can happen if:

- User subscribes multiple times
- Webhook is called multiple times

To handle this:

- Query for the most recent active subscription
- Or implement logic to cancel old subscriptions when a new one is created

## Security Considerations

1. **API Key Security**: Never expose your Appwrite API key in client-side code
2. **Webhook Verification**: Always verify Stripe webhook signatures
3. **User Authentication**: Require authentication before allowing subscription creation
4. **Document Security**: Enable document-level security so users can only access their own subscriptions

## Next Steps

1. Update your profile API to read from the `subscriptions` collection
2. Implement subscription status checks in your application
3. Add subscription management UI (cancel, upgrade, downgrade)
4. Set up email notifications for subscription events
