/**
 * Test guest permissions by trying to connect without API key
 */

require("dotenv").config();
const { Client, Databases } = require("node-appwrite");

async function testGuestPermissions() {
  try {
    console.log("🧪 Testing guest permissions (no API key)...");
    console.log("=====================================");

    // Create client WITHOUT API key (like browser would)
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
    // Intentionally NOT setting .setKey() to simulate browser

    const databases = new Databases(client);
    const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID_TRIALS;

    console.log(`Attempting to access:`);
    console.log(`  Database: ${DATABASE_ID}`);
    console.log(`  Collection: ${COLLECTION_ID}`);
    console.log("");

    // Try to list documents as guest
    console.log("1️⃣ Testing READ permissions...");
    try {
      const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID);
      console.log("✅ READ successful!");
      console.log(`   Found ${result.total} documents`);
    } catch (error) {
      console.error("❌ READ failed:", error.message);
      console.error(`   Code: ${error.code}`);
      console.error(`   Type: ${error.type}`);
    }

    // Try to create a document as guest
    console.log("\n2️⃣ Testing CREATE permissions...");
    try {
      const testDoc = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        "unique()",
        {
          session_id: "guest_test_" + Date.now(),
          ip_address: "127.0.0.1",
          user_agent: "Test Guest User Agent",
          start_time: Date.now(),
          end_time: Date.now() + 15 * 60 * 1000,
          is_active: true,
          device_fingerprint: "guest_test_fp",
        },
      );
      console.log("✅ CREATE successful!");
      console.log(`   Created document: ${testDoc.$id}`);

      // Cleanup
      try {
        await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, testDoc.$id);
        console.log("✅ Cleanup successful");
      } catch (cleanupError) {
        console.log("⚠️ Cleanup failed (but creation worked)");
      }
    } catch (error) {
      console.error("❌ CREATE failed:", error.message);
      console.error(`   Code: ${error.code}`);
      console.error(`   Type: ${error.type}`);
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testGuestPermissions();
