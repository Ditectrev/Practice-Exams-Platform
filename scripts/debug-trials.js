/**
 * Debug script to check current trials in the database
 * Usage: node scripts/debug-trials.js
 */

require("dotenv").config();
const { Client, Databases } = require("node-appwrite");

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.NEXT_PUBLIC_APPWRITE_API_KEY);

const databases = new Databases(client);

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID;

async function debugTrials() {
  try {
    console.log("🔍 Debugging trials in database...");
    console.log("Database ID:", DATABASE_ID);
    console.log("Collection ID:", COLLECTION_ID);
    console.log("=====================================");

    const result = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [],
      100,
    );

    console.log(`📊 Found ${result.total} total trials:`);
    console.log("=====================================");

    if (result.documents.length === 0) {
      console.log("❌ No trials found in database");
      return;
    }

    const now = Date.now();

    result.documents.forEach((trial, index) => {
      const isActive = trial.is_active && now < trial.end_time;
      const timeRemaining = Math.max(0, trial.end_time - now);
      const minutesRemaining = Math.floor(timeRemaining / 60000);
      const secondsRemaining = Math.floor((timeRemaining % 60000) / 1000);

      console.log(`\n📋 Trial ${index + 1}:`);
      console.log(`   ID: ${trial.$id}`);
      console.log(`   Session ID: ${trial.session_id}`);
      console.log(
        `   Device Fingerprint: ${trial.device_fingerprint.substring(
          0,
          20,
        )}...`,
      );
      console.log(
        `   Start Time: ${new Date(trial.start_time).toLocaleString()}`,
      );
      console.log(`   End Time: ${new Date(trial.end_time).toLocaleString()}`);
      console.log(`   Is Active (DB): ${trial.is_active}`);
      console.log(`   Is Still Active: ${isActive ? "✅" : "❌"}`);
      console.log(
        `   Time Remaining: ${minutesRemaining}:${secondsRemaining
          .toString()
          .padStart(2, "0")}`,
      );
      console.log(`   User Agent: ${trial.user_agent.substring(0, 50)}...`);
    });

    // Summary
    const activeTrials = result.documents.filter(
      (trial) => trial.is_active && now < trial.end_time,
    );

    console.log("\n📈 Summary:");
    console.log(`   Total Trials: ${result.documents.length}`);
    console.log(`   Active Trials: ${activeTrials.length}`);
    console.log(
      `   Expired Trials: ${result.documents.length - activeTrials.length}`,
    );
  } catch (error) {
    console.error("❌ Error debugging trials:", error);
  }
}

debugTrials();
