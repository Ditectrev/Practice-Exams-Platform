/**
 * Debug script to test trial creation with browser-like conditions
 * Usage: node scripts/debug-trial-creation.js
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

async function debugTrialCreation() {
  try {
    console.log("🔍 Debugging trial creation...");
    console.log("=====================================");
    console.log(`Database ID: ${DATABASE_ID}`);
    console.log(`Collection ID: ${COLLECTION_ID}`);
    console.log("");

    // Check current state
    console.log("1️⃣ Checking current database state...");
    const currentTrials = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
    );
    console.log(`Found ${currentTrials.total} existing trials`);

    if (currentTrials.total > 0) {
      console.log("Existing trials:");
      currentTrials.documents.forEach((trial, index) => {
        console.log(`  ${index + 1}. ID: ${trial.$id}`);
        console.log(`     Session: ${trial.session_id}`);
        console.log(`     IP: ${trial.ip_address}`);
        console.log(`     Active: ${trial.is_active}`);
        console.log(
          `     Start: ${new Date(trial.start_time).toLocaleString()}`,
        );
        console.log(`     End: ${new Date(trial.end_time).toLocaleString()}`);
        console.log("");
      });
    }

    // Simulate browser session creation
    console.log("2️⃣ Simulating browser trial creation...");
    const sessionId = `browser_session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const deviceFingerprint = `fp_browser_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const ipAddress = "192.168.1.100"; // Simulate browser IP
    const startTime = Date.now();
    const endTime = startTime + 15 * 60 * 1000; // 15 minutes

    console.log(`Attempting to create trial with:`);
    console.log(`  Session ID: ${sessionId}`);
    console.log(`  Device FP: ${deviceFingerprint}`);
    console.log(`  IP Address: ${ipAddress}`);
    console.log(`  Start Time: ${new Date(startTime).toLocaleString()}`);
    console.log(`  End Time: ${new Date(endTime).toLocaleString()}`);

    try {
      const newTrial = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        "unique()",
        {
          session_id: sessionId,
          ip_address: ipAddress,
          user_agent:
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          start_time: startTime,
          end_time: endTime,
          is_active: true,
          device_fingerprint: deviceFingerprint,
        },
      );

      console.log("✅ Trial creation successful!");
      console.log(`   New Trial ID: ${newTrial.$id}`);

      // Verify it was created
      console.log("\n3️⃣ Verifying trial was created...");
      const verification = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
      );
      console.log(`Total trials now: ${verification.total}`);

      return newTrial.$id;
    } catch (createError) {
      console.error("❌ Trial creation failed:", createError.message);
      console.error("Error details:", createError);
      return null;
    }
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
    console.error("Full error:", error);
  }
}

debugTrialCreation();
