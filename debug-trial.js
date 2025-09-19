// Simple debug script you can run in browser console
// Copy and paste this into your browser's developer console

console.log("🔍 Debugging trial system in browser...");

// Check if Appwrite is loaded
if (typeof window !== "undefined") {
  console.log("✅ Running in browser environment");

  // Check environment variables
  console.log("Environment check:");
  console.log("- Current URL:", window.location.href);

  // Check localStorage
  console.log("\nLocalStorage check:");
  console.log("- currentTrialId:", localStorage.getItem("currentTrialId"));
  console.log("- trial_session_id:", localStorage.getItem("trial_session_id"));
  console.log("- ip_fallback_id:", localStorage.getItem("ip_fallback_id"));
  console.log("- trial_ever_used:", localStorage.getItem("trial_ever_used"));

  // Check sessionStorage
  console.log("\nSessionStorage check:");
  console.log("- trial_ever_used:", sessionStorage.getItem("trial_ever_used"));

  // Test Appwrite connection
  console.log("\n🧪 Testing Appwrite connection...");

  try {
    // This will tell us if Appwrite client can be created
    fetch("https://fra.cloud.appwrite.io/v1/health")
      .then((response) => response.json())
      .then((data) => {
        console.log("✅ Appwrite server reachable:", data);
      })
      .catch((error) => {
        console.error("❌ Appwrite server not reachable:", error);
      });
  } catch (error) {
    console.error("❌ Failed to test Appwrite connection:", error);
  }
} else {
  console.log("❌ Not running in browser environment");
}
