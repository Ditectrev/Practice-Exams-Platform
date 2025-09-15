/**
 * Test script to verify the trial system is working correctly
 * Usage: node scripts/test-trial-system.js
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

async function testTrialSystem() {
  try {
    console.log("🧪 Testing trial system...");
    console.log("=====================================");

    // Test 1: Check database connection
    console.log("1️⃣ Testing database connection...");
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [],
        1,
      );
      console.log("✅ Database connection successful");
      console.log(`   Found ${result.total} existing trials`);
    } catch (error) {
      console.error("❌ Database connection failed:", error.message);
      return;
    }

    // Test 2: Create a test trial
    console.log("\n2️⃣ Testing trial creation...");
    const testSessionId = "test_session_" + Date.now();
    const testDeviceFingerprint = "test_fp_" + Date.now();
    const startTime = Date.now();
    const endTime = startTime + 15 * 60 * 1000; // 15 minutes

    let testTrialId;
    try {
      const trialRecord = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        "unique()",
        {
          session_id: testSessionId,
          user_agent: "Test User Agent",
          start_time: startTime,
          end_time: endTime,
          is_active: true,
          device_fingerprint: testDeviceFingerprint,
        },
      );

      testTrialId = trialRecord.$id;
      console.log("✅ Trial creation successful");
      console.log(`   Trial ID: ${testTrialId}`);
      console.log(`   Session ID: ${testSessionId}`);
    } catch (error) {
      console.error("❌ Trial creation failed:", error.message);
      return;
    }

    // Test 3: Query trials by session ID
    console.log("\n3️⃣ Testing trial query by session ID...");
    try {
      const { Query } = require("node-appwrite");
      const sessionTrials = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal("session_id", testSessionId)],
      );

      if (sessionTrials.documents.length > 0) {
        console.log("✅ Session ID query successful");
        console.log(
          `   Found ${sessionTrials.documents.length} trial(s) for session`,
        );
      } else {
        console.log("❌ Session ID query failed - no trials found");
      }
    } catch (error) {
      console.error("❌ Session ID query failed:", error.message);
    }

    // Test 4: Query trials by device fingerprint
    console.log("\n4️⃣ Testing trial query by device fingerprint...");
    try {
      const { Query } = require("node-appwrite");
      const deviceTrials = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal("device_fingerprint", testDeviceFingerprint)],
      );

      if (deviceTrials.documents.length > 0) {
        console.log("✅ Device fingerprint query successful");
        console.log(
          `   Found ${deviceTrials.documents.length} trial(s) for device`,
        );
      } else {
        console.log("❌ Device fingerprint query failed - no trials found");
      }
    } catch (error) {
      console.error("❌ Device fingerprint query failed:", error.message);
    }

    // Test 5: Update trial (expire it)
    console.log("\n5️⃣ Testing trial update (expiration)...");
    try {
      await databases.updateDocument(DATABASE_ID, COLLECTION_ID, testTrialId, {
        is_active: false,
      });
      console.log("✅ Trial update successful");
    } catch (error) {
      console.error("❌ Trial update failed:", error.message);
    }

    // Test 6: Verify trial is expired
    console.log("\n6️⃣ Verifying trial expiration...");
    try {
      const updatedTrial = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID,
        testTrialId,
      );
      if (!updatedTrial.is_active) {
        console.log("✅ Trial expiration verified");
      } else {
        console.log("❌ Trial expiration failed - still active");
      }
    } catch (error) {
      console.error("❌ Failed to verify trial expiration:", error.message);
    }

    // Cleanup
    console.log("\n7️⃣ Cleaning up test trial...");
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, testTrialId);
      console.log("✅ Test trial cleaned up");
    } catch (error) {
      console.error("❌ Failed to clean up test trial:", error.message);
    }

    console.log("\n🎉 Trial system test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testTrialSystem();
