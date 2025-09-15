/**
 * Cleanup script to remove old or duplicate trials
 * Usage: node scripts/cleanup-trials.js [--expired-only] [--duplicates-only] [--all]
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

async function cleanupTrials() {
  try {
    const args = process.argv.slice(2);
    const expiredOnly = args.includes("--expired-only");
    const duplicatesOnly = args.includes("--duplicates-only");
    const all = args.includes("--all");

    console.log("🧹 Cleaning up trials...");
    console.log(
      "Mode:",
      expiredOnly
        ? "Expired only"
        : duplicatesOnly
        ? "Duplicates only"
        : all
        ? "All trials"
        : "Interactive",
    );
    console.log("=====================================");

    const result = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [],
      100,
    );

    if (result.documents.length === 0) {
      console.log("✅ No trials found. Database is clean.");
      return;
    }

    const now = Date.now();
    let trialsToDelete = [];

    if (all) {
      trialsToDelete = result.documents;
      console.log(`🗑️  Will delete ALL ${trialsToDelete.length} trials`);
    } else if (expiredOnly) {
      trialsToDelete = result.documents.filter(
        (trial) => !trial.is_active || now >= trial.end_time,
      );
      console.log(`🗑️  Will delete ${trialsToDelete.length} expired trials`);
    } else if (duplicatesOnly) {
      // Group by session_id and device_fingerprint
      const groups = {};
      result.documents.forEach((trial) => {
        const key = `${trial.session_id}-${trial.device_fingerprint}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(trial);
      });

      // Find duplicates (keep the most recent)
      Object.values(groups).forEach((group) => {
        if (group.length > 1) {
          // Sort by creation time (most recent first)
          group.sort((a, b) => b.start_time - a.start_time);
          // Keep the first (most recent), delete the rest
          trialsToDelete.push(...group.slice(1));
        }
      });

      console.log(`🗑️  Will delete ${trialsToDelete.length} duplicate trials`);
    } else {
      // Interactive mode
      console.log(`Found ${result.documents.length} trials:`);
      result.documents.forEach((trial, index) => {
        const isActive = trial.is_active && now < trial.end_time;
        console.log(
          `${index + 1}. ${trial.$id} - ${isActive ? "Active" : "Expired"} - ${
            trial.session_id
          }`,
        );
      });

      console.log(
        "\nUse --expired-only, --duplicates-only, or --all to specify what to clean up.",
      );
      return;
    }

    if (trialsToDelete.length === 0) {
      console.log("✅ No trials to delete.");
      return;
    }

    // Confirm deletion
    console.log("\nTrials to be deleted:");
    trialsToDelete.forEach((trial, index) => {
      const isActive = trial.is_active && now < trial.end_time;
      console.log(
        `${index + 1}. ${trial.$id} - ${isActive ? "Active" : "Expired"} - ${
          trial.session_id
        }`,
      );
    });

    // Delete trials
    let deletedCount = 0;
    for (const trial of trialsToDelete) {
      try {
        await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, trial.$id);
        console.log(`✅ Deleted trial: ${trial.$id}`);
        deletedCount++;
      } catch (error) {
        console.error(`❌ Failed to delete trial ${trial.$id}:`, error.message);
      }
    }

    console.log(`\n🎉 Cleanup complete! Deleted ${deletedCount} trials.`);
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  }
}

cleanupTrials();
