/**
 * Setup script for the Appwrite users collection
 *
 * This collection stores user preferences and API keys for AI explanations.
 *
 * Prerequisites:
 * 1. Create a .env file with the following variables:
 *    - NEXT_PUBLIC_APPWRITE_ENDPOINT
 *    - NEXT_PUBLIC_APPWRITE_PROJECT_ID
 *    - NEXT_PUBLIC_APPWRITE_API_KEY (with database permissions)
 *    - NEXT_PUBLIC_APPWRITE_DATABASE_ID
 *
 * Usage:
 *   node scripts/setup-users-database.js
 */

const { Client, Databases, Permission, Role } = require("node-appwrite");
require("dotenv").config();

const COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID_EXPLANATIONS_API_KEYS;

async function setupUsersCollection() {
  console.log("🚀 Setting up Appwrite Explanations API Keys collection...\n");

  // Validate environment variables
  const requiredEnvVars = [
    "NEXT_PUBLIC_APPWRITE_ENDPOINT",
    "NEXT_PUBLIC_APPWRITE_PROJECT_ID",
    "NEXT_PUBLIC_APPWRITE_API_KEY",
    "NEXT_PUBLIC_APPWRITE_DATABASE_ID",
    "NEXT_PUBLIC_APPWRITE_COLLECTION_ID_EXPLANATIONS_API_KEYS",
  ];

  const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
  if (missingVars.length > 0) {
    console.error("❌ Missing required environment variables:");
    missingVars.forEach((v) => console.error(`   - ${v}`));
    process.exit(1);
  }

  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.NEXT_PUBLIC_APPWRITE_API_KEY);

  const databases = new Databases(client);
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

  try {
    // Check if collection already exists
    try {
      await databases.getCollection(databaseId, COLLECTION_ID);
      console.log("⚠️  Collection already exists. Skipping creation...");
      console.log(
        "   If you want to recreate it, delete the collection first in Appwrite Console.",
      );
      return;
    } catch (error) {
      if (error.code !== 404) {
        throw error;
      }
      // Collection doesn't exist, proceed with creation
    }

    // Create the collection
    console.log("📦 Creating collection...");
    await databases.createCollection(
      databaseId,
      COLLECTION_ID,
      COLLECTION_ID,
      [
        // Users can read their own data
        Permission.read(Role.users()),
        // Only server can create/update/delete (via API routes)
      ],
      false, // documentSecurity - false means collection-level permissions apply
    );
    console.log("✅ Collection created\n");

    // Create attributes
    console.log("📝 Creating attributes...\n");

    // appwrite_user_id - links to authenticated user (primary identifier)
    console.log("   Creating appwrite_user_id attribute...");
    await databases.createStringAttribute(
      databaseId,
      COLLECTION_ID,
      "appwrite_user_id",
      255,
      true, // required
    );
    console.log("   ✅ appwrite_user_id created");

    // email - user's email for reference
    console.log("   Creating email attribute...");
    await databases.createEmailAttribute(
      databaseId,
      COLLECTION_ID,
      "email",
      false, // optional
    );
    console.log("   ✅ email created");

    // API keys - stored as encrypted strings
    const apiKeyProviders = ["openai", "gemini", "mistral", "deepseek"];
    for (const provider of apiKeyProviders) {
      const attrName = `${provider}_api_key`;
      console.log(`   Creating ${attrName} attribute...`);
      await databases.createStringAttribute(
        databaseId,
        COLLECTION_ID,
        attrName,
        500, // Allow for encrypted key storage
        false, // optional
      );
      console.log(`   ✅ ${attrName} created`);
    }

    // explanation_provider - user's preferred AI provider
    console.log("   Creating explanation_provider attribute...");
    await databases.createEnumAttribute(
      databaseId,
      COLLECTION_ID,
      "explanation_provider",
      ["ollama", "openai", "gemini", "mistral", "deepseek", "ditectrev"],
      false, // optional
      "ollama", // default value
    );
    console.log("   ✅ explanation_provider created");

    // Wait for attributes to be ready
    console.log("\n⏳ Waiting for attributes to be ready...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Create indexes
    console.log("\n📑 Creating indexes...\n");

    // Unique index on appwrite_user_id (one record per user)
    console.log("   Creating unique index on appwrite_user_id...");
    await databases.createIndex(
      databaseId,
      COLLECTION_ID,
      "idx_appwrite_user_id",
      "unique",
      ["appwrite_user_id"],
    );
    console.log("   ✅ idx_appwrite_user_id created");

    // Index on email for fallback lookups
    console.log("   Creating index on email...");
    await databases.createIndex(databaseId, COLLECTION_ID, "idx_email", "key", [
      "email",
    ]);
    console.log("   ✅ idx_email created");

    console.log("\n✅ Collection setup complete!");
    console.log("\n📋 Collection Summary:");
    console.log("   - Collection ID: (from env variable)");
    console.log("   - Attributes: appwrite_user_id, email, openai_api_key,");
    console.log(
      "                 gemini_api_key, mistral_api_key, deepseek_api_key,",
    );
    console.log("                 explanation_provider");
    console.log("   - Indexes: idx_appwrite_user_id (unique), idx_email");
    console.log("\n🔒 Security Notes:");
    console.log("   - Users can read their own data");
    console.log(
      "   - Create/update/delete is server-side only (via API routes)",
    );
    console.log("   - API keys are encrypted before storage (handled in app)");
    console.log(
      "\n✅ Don't forget to add NEXT_PUBLIC_APPWRITE_COLLECTION_ID_EXPLANATIONS_API_KEYS to Vercel!",
    );
  } catch (error) {
    console.error("\n❌ Error setting up collection:", error.message);
    if (error.response) {
      console.error("   Response:", JSON.stringify(error.response, null, 2));
    }
    process.exit(1);
  }
}

setupUsersCollection();
