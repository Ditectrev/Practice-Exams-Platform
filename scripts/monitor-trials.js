/**
 * Monitor script to watch trials in real-time
 * Usage: node scripts/monitor-trials.js [--interval=5000]
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

async function monitorTrials() {
  const args = process.argv.slice(2);
  const intervalArg = args.find((arg) => arg.startsWith("--interval="));
  const interval = intervalArg ? parseInt(intervalArg.split("=")[1]) : 5000; // Default 5 seconds

  console.log("👀 Monitoring trials...");
  console.log(`   Interval: ${interval}ms`);
  console.log("   Press Ctrl+C to stop");
  console.log("=====================================");

  let lastCount = 0;

  const checkTrials = async () => {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [],
        100,
      );
      const now = Date.now();

      const activeTrials = result.documents.filter(
        (trial) => trial.is_active && now < trial.end_time,
      );

      const expiredTrials = result.documents.filter(
        (trial) => !trial.is_active || now >= trial.end_time,
      );

      // Only log if there are changes or every 10th check
      if (result.documents.length !== lastCount || Math.random() < 0.1) {
        console.log(`\n[${new Date().toLocaleTimeString()}] 📊 Trial Status:`);
        console.log(`   Total: ${result.documents.length}`);
        console.log(`   Active: ${activeTrials.length}`);
        console.log(`   Expired: ${expiredTrials.length}`);

        if (activeTrials.length > 0) {
          console.log("   Active Trials:");
          activeTrials.forEach((trial) => {
            const timeRemaining = Math.max(0, trial.end_time - now);
            const minutes = Math.floor(timeRemaining / 60000);
            const seconds = Math.floor((timeRemaining % 60000) / 1000);
            console.log(
              `     - ${trial.$id}: ${minutes}:${seconds
                .toString()
                .padStart(2, "0")} remaining`,
            );
          });
        }

        lastCount = result.documents.length;
      }
    } catch (error) {
      console.error("❌ Error monitoring trials:", error.message);
    }
  };

  // Initial check
  await checkTrials();

  // Set up interval
  const intervalId = setInterval(checkTrials, interval);

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n\n👋 Stopping monitor...");
    clearInterval(intervalId);
    process.exit(0);
  });
}

monitorTrials();
