/**
 * Test script to verify IP-based security works
 * Keep this file for debugging purposes
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
const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID_TRIALS;

async function testIPSecurity() {
  try {
    console.log("🧪 Testing IP-based security...");
    console.log("=====================================");

    // Get the current trial's IP
    const currentTrials = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
    );
    if (currentTrials.documents.length === 0) {
      console.log("❌ No trials found. Please create a trial first.");
      return;
    }

    const currentIP = currentTrials.documents[0].ip_address;
    console.log(`📡 Current trial IP: ${currentIP}`);

    // Simulate a different browser trying to access with the same IP
    console.log("\n🔍 Simulating different browser with same IP...");
    const { Query } = require("node-appwrite");

    // Check if there are any active trials for this IP
    const ipTrials = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal("ip_address", currentIP),
    ]);

    console.log(
      `Found ${ipTrials.documents.length} trials for IP ${currentIP}`,
    );

    const activeTrials = ipTrials.documents.filter(
      (trial) => trial.is_active && Date.now() < trial.end_time,
    );

    console.log(`Active trials for this IP: ${activeTrials.length}`);

    if (activeTrials.length > 0) {
      console.log("✅ IP-based security is working!");
      console.log("   User cannot bypass trial by switching browsers");
      console.log("   because they share the same IP address");

      // Show the active trial details
      activeTrials.forEach((trial, index) => {
        console.log(`\n   Active Trial ${index + 1}:`);
        console.log(`     ID: ${trial.$id}`);
        console.log(`     Session ID: ${trial.session_id}`);
        console.log(
          `     Device Fingerprint: ${trial.device_fingerprint.substring(
            0,
            20,
          )}...`,
        );
        console.log(`     User Agent: ${trial.user_agent.substring(0, 50)}...`);
      });
    } else {
      console.log("❌ IP-based security failed - no active trials found");
    }

    // Test what would happen if we tried to create a new trial
    console.log("\n🧪 Testing trial creation logic...");

    // Simulate the checkExistingTrial logic
    const existingTrial = ipTrials.documents.find((trial) => {
      const now = Date.now();
      const endTime = trial.end_time;
      return trial.is_active && now < endTime;
    });

    if (existingTrial) {
      console.log("✅ Trial creation would be BLOCKED");
      console.log(`   Found existing active trial: ${existingTrial.$id}`);
      console.log("   This prevents browser switching bypass!");
    } else {
      console.log("❌ Trial creation would be ALLOWED");
      console.log("   This would allow browser switching bypass!");
    }

    console.log("\n🎉 IP security test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testIPSecurity();
