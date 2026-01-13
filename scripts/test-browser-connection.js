/**
 * Test script to check browser-side Appwrite connection
 * This simulates what happens in the browser
 */

require("dotenv").config();

// Simulate browser environment variables (these should be NEXT_PUBLIC_*)
const config = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
  collectionId: process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID_TRIALS,
  // Note: Browser doesn't have API key - uses session-based auth
};

console.log("🌐 Testing browser-side configuration...");
console.log("=====================================");
console.log("Environment variables that browser would see:");
console.log(`NEXT_PUBLIC_APPWRITE_ENDPOINT: ${config.endpoint}`);
console.log(`NEXT_PUBLIC_APPWRITE_PROJECT_ID: ${config.projectId}`);
console.log(`NEXT_PUBLIC_APPWRITE_DATABASE_ID: ${config.databaseId}`);
console.log(`NEXT_PUBLIC_APPWRITE_COLLECTION_ID: ${config.collectionId}`);
console.log("");

// Check for missing variables
const missing = [];
if (!config.endpoint) missing.push("NEXT_PUBLIC_APPWRITE_ENDPOINT");
if (!config.projectId) missing.push("NEXT_PUBLIC_APPWRITE_PROJECT_ID");
if (!config.databaseId) missing.push("NEXT_PUBLIC_APPWRITE_DATABASE_ID");
if (!config.collectionId) missing.push("NEXT_PUBLIC_APPWRITE_COLLECTION_ID");

if (missing.length > 0) {
  console.error("❌ Missing environment variables:");
  missing.forEach((var_name) => console.error(`   - ${var_name}`));
  console.log("");
  console.log("Browser-side code won't work without these variables!");
} else {
  console.log("✅ All required environment variables are present");
}

console.log("");
console.log("🔍 Browser limitations to note:");
console.log("- Browser cannot use NEXT_PUBLIC_APPWRITE_API_KEY directly");
console.log("- Browser uses session-based authentication");
console.log("- CORS must be configured in Appwrite console");
console.log("- Network requests may fail if not authenticated");

// Test if we can create a client (without API key like browser would)
try {
  const { Client } = require("node-appwrite");
  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId);
  // No .setKey() - browsers don't use API keys

  console.log("");
  console.log("✅ Client configuration successful (browser-style)");
  console.log(
    "Note: Actual database operations would require user authentication in browser",
  );
} catch (error) {
  console.error("❌ Client configuration failed:", error.message);
}
