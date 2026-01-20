/**
 * Script to set up the subscriptions database in Appwrite
 * Run this script once to create the necessary database structure for tracking Stripe subscriptions
 */

require("dotenv").config();
const { Client, Databases, ID, IndexType } = require("node-appwrite");

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.NEXT_PUBLIC_APPWRITE_API_KEY);

const databases = new Databases(client);

// Use the existing database (same as trials) but with a separate collection
// This keeps concerns separated while working within database limits
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

async function setupSubscriptionsDatabase() {
  try {
    console.log("Setting up subscriptions collection...");

    if (!DATABASE_ID) {
      console.error("❌ NEXT_PUBLIC_APPWRITE_DATABASE_ID is not set");
      process.exit(1);
    }

    const SUBSCRIPTIONS_COLLECTION_ID =
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID_SUBSCRIPTIONS;
    if (!SUBSCRIPTIONS_COLLECTION_ID) {
      console.error(
        "❌ NEXT_PUBLIC_APPWRITE_COLLECTION_ID_SUBSCRIPTIONS is not set",
      );
      console.error(
        "   Please set this environment variable to your subscriptions collection ID",
      );
      process.exit(1);
    }

    console.log("✅ Using existing database:", DATABASE_ID);
    console.log(
      "📝 Creating separate 'subscriptions' collection in the same database",
    );
    console.log("📋 Collection ID:", SUBSCRIPTIONS_COLLECTION_ID);

    const databaseId = DATABASE_ID;

    // Create subscriptions collection
    try {
      await databases.createCollection({
        databaseId: databaseId,
        collectionId: SUBSCRIPTIONS_COLLECTION_ID,
        name: "Subscriptions",
        permissions: [
          'create("users")', // Only authenticated users can create
          'read("users")', // Users can read their own subscriptions
          'update("users")', // Users can update their own subscriptions
          'delete("users")', // Users can delete their own subscriptions
        ],
        documentSecurity: true, // Enable document-level security
        enabled: true,
      });
      console.log("✅ Subscriptions collection created successfully");
    } catch (error) {
      if (error.code === 409) {
        console.log("✅ Subscriptions collection already exists");
      } else {
        throw error;
      }
    }

    // Create collection attributes
    console.log("📝 Creating collection attributes...");

    // Appwrite User ID attribute (required - links to logged-in user)
    // This is critical because users may use different emails in Stripe checkout
    // than their account email, so we need to link by user ID
    try {
      await databases.createStringAttribute(
        databaseId,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID_SUBSCRIPTIONS,
        "appwrite_user_id",
        255,
        true, // required
      );
      console.log("✅ Appwrite User ID attribute created");
    } catch (error) {
      if (error.code === 409) {
        console.log("✅ Appwrite User ID attribute already exists");
      } else {
        console.log(
          "⚠️ Error creating appwrite_user_id attribute:",
          error.message,
        );
      }
    }

    // Stripe Customer ID attribute
    try {
      await databases.createStringAttribute(
        databaseId,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID_SUBSCRIPTIONS,
        "stripe_customer_id",
        255,
        false, // optional (may not exist for all subscriptions)
      );
      console.log("✅ Stripe Customer ID attribute created");
    } catch (error) {
      if (error.code === 409) {
        console.log("✅ Stripe Customer ID attribute already exists");
      } else {
        console.log(
          "⚠️ Error creating stripe_customer_id attribute:",
          error.message,
        );
      }
    }

    // Stripe Subscription ID attribute
    try {
      await databases.createStringAttribute(
        databaseId,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID_SUBSCRIPTIONS,
        "stripe_subscription_id",
        255,
        false, // optional
      );
      console.log("✅ Stripe Subscription ID attribute created");
    } catch (error) {
      if (error.code === 409) {
        console.log("✅ Stripe Subscription ID attribute already exists");
      } else {
        console.log(
          "⚠️ Error creating stripe_subscription_id attribute:",
          error.message,
        );
      }
    }

    // Stripe Price ID attribute
    try {
      await databases.createStringAttribute(
        databaseId,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID_SUBSCRIPTIONS,
        "stripe_price_id",
        255,
        false, // optional
      );
      console.log("✅ Stripe Price ID attribute created");
    } catch (error) {
      if (error.code === 409) {
        console.log("✅ Stripe Price ID attribute already exists");
      } else {
        console.log(
          "⚠️ Error creating stripe_price_id attribute:",
          error.message,
        );
      }
    }

    // Subscription Type attribute (ads-free, local, byok, ditectrev)
    // Note: Required attributes cannot have default values in Appwrite
    try {
      await databases.createStringAttribute(
        databaseId,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID_SUBSCRIPTIONS,
        "subscription_type",
        50,
        true, // required
      );
      console.log("✅ Subscription Type attribute created");
    } catch (error) {
      if (error.code === 409) {
        console.log("✅ Subscription Type attribute already exists");
      } else {
        console.log(
          "⚠️ Error creating subscription_type attribute:",
          error.message,
        );
      }
    }

    // Subscription Status attribute (active, canceled, past_due, unpaid)
    // Note: Required attributes cannot have default values in Appwrite
    try {
      await databases.createStringAttribute(
        databaseId,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID_SUBSCRIPTIONS,
        "subscription_status",
        50,
        true, // required
      );
      console.log("✅ Subscription Status attribute created");
    } catch (error) {
      if (error.code === 409) {
        console.log("✅ Subscription Status attribute already exists");
      } else {
        console.log(
          "⚠️ Error creating subscription_status attribute:",
          error.message,
        );
      }
    }

    // Current Period Start (timestamp)
    try {
      await databases.createIntegerAttribute(
        databaseId,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID_SUBSCRIPTIONS,
        "current_period_start",
        false, // optional
      );
      console.log("✅ Current Period Start attribute created");
    } catch (error) {
      if (error.code === 409) {
        console.log("✅ Current Period Start attribute already exists");
      } else {
        console.log(
          "⚠️ Error creating current_period_start attribute:",
          error.message,
        );
      }
    }

    // Current Period End (timestamp)
    try {
      await databases.createIntegerAttribute(
        databaseId,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID_SUBSCRIPTIONS,
        "current_period_end",
        false, // optional
      );
      console.log("✅ Current Period End attribute created");
    } catch (error) {
      if (error.code === 409) {
        console.log("✅ Current Period End attribute already exists");
      } else {
        console.log(
          "⚠️ Error creating current_period_end attribute:",
          error.message,
        );
      }
    }

    // Email attribute (billing email from Stripe - may differ from account email)
    try {
      await databases.createStringAttribute(
        databaseId,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID_SUBSCRIPTIONS,
        "email",
        255,
        false, // optional - billing email from Stripe (fallback for lookup)
      );
      console.log("✅ Email attribute created");
    } catch (error) {
      if (error.code === 409) {
        console.log("✅ Email attribute already exists");
      } else {
        console.log("⚠️ Error creating email attribute:", error.message);
      }
    }

    // Wait for attributes to be ready before creating indexes
    console.log("⏳ Waiting for attributes to be ready...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Create indexes
    console.log("📊 Creating indexes...");

    // Index on appwrite_user_id for fast lookups (primary identifier)
    try {
      await databases.createIndex({
        databaseId: DATABASE_ID,
        collectionId: SUBSCRIPTIONS_COLLECTION_ID,
        key: "idx_appwrite_user_id",
        type: IndexType.Key,
        attributes: ["appwrite_user_id"],
      });
      console.log("✅ Index on appwrite_user_id created");
    } catch (error) {
      if (error.code === 409) {
        console.log("✅ Index on appwrite_user_id already exists");
      } else {
        console.log("⚠️ Error creating index:", error.message);
      }
    }

    // Index on email for fallback lookups
    try {
      await databases.createIndex({
        databaseId: DATABASE_ID,
        collectionId: SUBSCRIPTIONS_COLLECTION_ID,
        key: "idx_email",
        type: IndexType.Key,
        attributes: ["email"],
      });
      console.log("✅ Index on email created");
    } catch (error) {
      if (error.code === 409) {
        console.log("✅ Index on email already exists");
      } else {
        console.log("⚠️ Error creating index:", error.message);
      }
    }

    // Index on stripe_subscription_id for webhook lookups
    try {
      await databases.createIndex({
        databaseId: DATABASE_ID,
        collectionId: SUBSCRIPTIONS_COLLECTION_ID,
        key: "idx_stripe_subscription_id",
        type: IndexType.Unique,
        attributes: ["stripe_subscription_id"],
      });
      console.log("✅ Index on stripe_subscription_id created");
    } catch (error) {
      if (error.code === 409) {
        console.log("✅ Index on stripe_subscription_id already exists");
      } else {
        console.log("⚠️ Error creating index:", error.message);
      }
    }

    // Index on stripe_customer_id
    try {
      await databases.createIndex({
        databaseId: DATABASE_ID,
        collectionId: SUBSCRIPTIONS_COLLECTION_ID,
        key: "idx_stripe_customer_id",
        type: IndexType.Key,
        attributes: ["stripe_customer_id"],
      });
      console.log("✅ Index on stripe_customer_id created");
    } catch (error) {
      if (error.code === 409) {
        console.log("✅ Index on stripe_customer_id already exists");
      } else {
        console.log("⚠️ Error creating index:", error.message);
      }
    }

    // Composite index for active subscriptions by user ID (primary)
    try {
      await databases.createIndex({
        databaseId: DATABASE_ID,
        collectionId: SUBSCRIPTIONS_COLLECTION_ID,
        key: "idx_user_status",
        type: IndexType.Key,
        attributes: ["appwrite_user_id", "subscription_status"],
      });
      console.log("✅ Composite index on appwrite_user_id and status created");
    } catch (error) {
      if (error.code === 409) {
        console.log("✅ Composite index already exists");
      } else {
        console.log("⚠️ Error creating composite index:", error.message);
      }
    }

    // Composite index for active subscriptions by email (fallback)
    try {
      await databases.createIndex({
        databaseId: DATABASE_ID,
        collectionId: SUBSCRIPTIONS_COLLECTION_ID,
        key: "idx_email_status",
        type: IndexType.Key,
        attributes: ["email", "subscription_status"],
      });
      console.log("✅ Composite index on email and status created");
    } catch (error) {
      if (error.code === 409) {
        console.log("✅ Composite index already exists");
      } else {
        console.log("⚠️ Error creating composite index:", error.message);
      }
    }

    console.log("\n✅ Subscriptions collection setup completed successfully!");
    console.log("\n📋 Database ID:", databaseId);
    console.log("📋 Collection ID:", SUBSCRIPTIONS_COLLECTION_ID);
    console.log(
      "\n📝 Note: Using the same database as trials, but with a separate collection",
    );
    console.log("   This keeps subscriptions and trials logically separated.");
    console.log("\n📋 Make sure to set up permissions in Appwrite Console:");
    console.log("   - Users can read/update/delete their own documents");
    console.log(
      "   - Server-side code (with API key) can create/update any document",
    );
  } catch (error) {
    console.error("❌ Error setting up subscriptions database:", error);
    process.exit(1);
  }
}

setupSubscriptionsDatabase();
