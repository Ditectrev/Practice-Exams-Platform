/**
 * Script to set up the trial tracking database in Appwrite
 * Run this script once to create the necessary database structure
 */

require("dotenv").config();
const { Client, Databases, ID, IndexType } = require("node-appwrite");

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.NEXT_PUBLIC_APPWRITE_API_KEY);

const databases = new Databases(client);

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID;

async function setupTrialDatabase() {
  try {
    console.log("Setting up trial tracking database...");

    // Check if database exists (skip creation if we already have a database ID)
    if (DATABASE_ID) {
      console.log("✅ Using existing database:", DATABASE_ID);
    } else {
      // Create database only if no database ID is provided
      try {
        await databases.create({
          databaseId: "trial_tracking",
          name: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_NAME,
          enabled: true,
        });
        console.log("✅ Database created successfully");
      } catch (error) {
        if (error.code === 409) {
          console.log("✅ Database already exists");
        } else {
          throw error;
        }
      }
    }

    // Create collection
    try {
      await databases.createCollection({
        databaseId: DATABASE_ID,
        collectionId: COLLECTION_ID,
        name: "Trial Records",
        permissions: [
          'create("any")', // Allow anyone to create documents
          'read("any")', // Allow anyone to read documents
          'update("any")', // Allow anyone to update documents
          'delete("any")', // Allow anyone to delete documents
        ],
        documentSecurity: false,
        enabled: true,
      });
      console.log("✅ Collection created successfully");
    } catch (error) {
      if (error.code === 409) {
        console.log("✅ Collection already exists");
      } else {
        throw error;
      }
    }

    // Create collection attributes
    console.log("📝 Creating collection attributes...");

    // Session ID attribute
    try {
      await databases.createStringAttribute(
        DATABASE_ID,
        COLLECTION_ID,
        "session_id",
        255,
        true, // required
      );
      console.log("✅ Session ID attribute created");
    } catch (error) {
      if (error.code === 409) {
        console.log("✅ Session ID attribute already exists");
      } else {
        console.log("⚠️ Error creating session_id attribute:", error.message);
      }
    }

    // IP Address attribute
    try {
      await databases.createStringAttribute(
        DATABASE_ID,
        COLLECTION_ID,
        "ip_address",
        255,
        true, // required
      );
      console.log("✅ IP address attribute created");
    } catch (error) {
      if (error.code === 409) {
        console.log("✅ IP address attribute already exists");
      } else {
        console.log("⚠️ Error creating ip_address attribute:", error.message);
      }
    }

    // User Agent attribute
    try {
      await databases.createStringAttribute(
        DATABASE_ID,
        COLLECTION_ID,
        "user_agent",
        1000,
        true, // required
      );
      console.log("✅ User agent attribute created");
    } catch (error) {
      if (error.code === 409) {
        console.log("✅ User agent attribute already exists");
      } else {
        console.log("⚠️ Error creating user_agent attribute:", error.message);
      }
    }

    // Start Time attribute
    try {
      await databases.createIntegerAttribute(
        DATABASE_ID,
        COLLECTION_ID,
        "start_time",
        true, // required
      );
      console.log("✅ Start time attribute created");
    } catch (error) {
      if (error.code === 409) {
        console.log("✅ Start time attribute already exists");
      } else {
        console.log("⚠️ Error creating start_time attribute:", error.message);
      }
    }

    // End Time attribute
    try {
      await databases.createIntegerAttribute(
        DATABASE_ID,
        COLLECTION_ID,
        "end_time",
        true, // required
      );
      console.log("✅ End time attribute created");
    } catch (error) {
      if (error.code === 409) {
        console.log("✅ End time attribute already exists");
      } else {
        console.log("⚠️ Error creating end_time attribute:", error.message);
      }
    }

    // Is Active attribute
    try {
      await databases.createBooleanAttribute(
        DATABASE_ID,
        COLLECTION_ID,
        "is_active",
        true, // required
      );
      console.log("✅ Is active attribute created");
    } catch (error) {
      if (error.code === 409) {
        console.log("✅ Is active attribute already exists");
      } else {
        console.log("⚠️ Error creating is_active attribute:", error.message);
      }
    }

    // Device Fingerprint attribute
    try {
      await databases.createStringAttribute(
        DATABASE_ID,
        COLLECTION_ID,
        "device_fingerprint",
        1000,
        true, // required
      );
      console.log("✅ Device fingerprint attribute created");
    } catch (error) {
      if (error.code === 409) {
        console.log("✅ Device fingerprint attribute already exists");
      } else {
        console.log(
          "⚠️ Error creating device_fingerprint attribute:",
          error.message,
        );
      }
    }

    // Create indexes for efficient queries
    try {
      await databases.createIndex({
        databaseId: DATABASE_ID,
        collectionId: COLLECTION_ID,
        key: "idx_ip_address",
        type: IndexType.Key,
        attributes: ["ip_address"],
      });
      console.log("✅ IP address index created");
    } catch (error) {
      if (error.code === 409) {
        console.log("✅ IP address index already exists");
      }
    }

    try {
      await databases.createIndex({
        databaseId: DATABASE_ID,
        collectionId: COLLECTION_ID,
        key: "idx_device_fingerprint",
        type: IndexType.Key,
        attributes: ["device_fingerprint"],
      });
      console.log("✅ Device fingerprint index created");
    } catch (error) {
      if (error.code === 409) {
        console.log("✅ Device fingerprint index already exists");
      }
    }

    try {
      await databases.createIndex({
        databaseId: DATABASE_ID,
        collectionId: COLLECTION_ID,
        key: "idx_active_trials",
        type: IndexType.Key,
        attributes: ["is_active", "end_time"],
      });
      console.log("✅ Active trials index created");
    } catch (error) {
      if (error.code === 409) {
        console.log("✅ Active trials index already exists");
      }
    }

    console.log("🎉 Trial tracking database setup complete!");
    console.log("\nNext steps:");
    console.log("1. Set APPWRITE_API_KEY environment variable");
    console.log(
      "2. Update your app to use useSecureTrial instead of useTrialTimer",
    );
    console.log("3. Test the secure trial system");
  } catch (error) {
    console.error("❌ Error setting up database:", error);
    process.exit(1);
  }
}

// Run the setup
setupTrialDatabase();
