import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Client, Databases } from "node-appwrite";

// Force dynamic rendering for webhook endpoint
export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Ensure Node.js runtime for Azure Static Web Apps

// Map Stripe price IDs to subscription types
const PRICE_ID_TO_SUBSCRIPTION: Record<string, string> = {
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_ADS_FREE || ""]: "ads-free",
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_LOCAL || ""]: "local",
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_BYOK || ""]: "byok",
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_DITECTREV || ""]: "ditectrev",
};

// Initialize Appwrite client
function getAppwriteClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "")
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "")
    .setKey(process.env.NEXT_PUBLIC_APPWRITE_API_KEY || "");

  return new Databases(client);
}

// GET handler for testing/health check and manual testing
export async function GET(request: NextRequest) {
  const SUBSCRIPTIONS_DATABASE_ID =
    process.env.NEXT_PUBLIC_APPWRITE_SUBSCRIPTIONS_DATABASE_ID ||
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const SUBSCRIPTIONS_COLLECTION_ID =
    process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID_SUBSCRIPTIONS ||
    "subscriptions";

  const searchParams = request.nextUrl.searchParams;
  const testWrite = searchParams.get("test") === "write";

  // Test database write capability
  if (testWrite) {
    try {
      const databases = getAppwriteClient();
      if (
        !databases ||
        !SUBSCRIPTIONS_DATABASE_ID ||
        !SUBSCRIPTIONS_COLLECTION_ID
      ) {
        return NextResponse.json(
          {
            error: "Database not configured",
            config: {
              databaseId: SUBSCRIPTIONS_DATABASE_ID || "NOT SET",
              collectionId: SUBSCRIPTIONS_COLLECTION_ID || "NOT SET",
            },
          },
          { status: 500 },
        );
      }

      const { ID } = await import("node-appwrite");
      const testDoc = await databases.createDocument(
        SUBSCRIPTIONS_DATABASE_ID,
        SUBSCRIPTIONS_COLLECTION_ID,
        ID.unique(),
        {
          appwrite_user_id: "test_user_" + Date.now(),
          subscription_type: "free",
          subscription_status: "active",
          email: "test@example.com",
        },
      );

      return NextResponse.json({
        success: true,
        message: "Test document created successfully",
        documentId: testDoc.$id,
        config: {
          databaseId: SUBSCRIPTIONS_DATABASE_ID,
          collectionId: SUBSCRIPTIONS_COLLECTION_ID,
        },
      });
    } catch (error: any) {
      return NextResponse.json(
        {
          error: "Failed to create test document",
          message: error.message,
          code: error.code,
          config: {
            databaseId: SUBSCRIPTIONS_DATABASE_ID || "NOT SET",
            collectionId: SUBSCRIPTIONS_COLLECTION_ID || "NOT SET",
          },
        },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    message: "Stripe webhook endpoint is active",
    timestamp: new Date().toISOString(),
    config: {
      databaseId: SUBSCRIPTIONS_DATABASE_ID || "NOT SET",
      collectionId: SUBSCRIPTIONS_COLLECTION_ID || "NOT SET",
      hasDatabaseId: !!SUBSCRIPTIONS_DATABASE_ID,
      hasCollectionId: !!SUBSCRIPTIONS_COLLECTION_ID,
    },
    test: "Add ?test=write to test database write capability",
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  const stripeSecretKey = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: "Stripe secret key not configured" },
      { status: 500 },
    );
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2025-11-17.clover",
  });

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    // Note: Using NEXT_PUBLIC_ prefix is required for Azure Static Web Apps runtime access
    // For localhost testing with Stripe CLI, use the webhook secret from: stripe listen --forward-to localhost:3000/api/stripe/webhook
    const webhookSecret =
      process.env.STRIPE_WEBHOOK_SECRET ||
      process.env.NEXT_PUBLIC_STRIPE_WEBHOOK_SECRET ||
      process.env.STRIPE_WEBHOOK_SECRET_LOCAL; // For localhost testing
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 },
      );
    }

    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 },
    );
  }

  try {
    console.log("📨 Received Stripe webhook event:", event.type);

    // Handle the event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Get Appwrite user ID from metadata (this is the key identifier)
      const appwriteUserId = session.metadata?.appwriteUserId;
      const customerEmail =
        session.customer_email || session.customer_details?.email;
      const subscriptionId = session.subscription as string;
      const priceId = session.metadata?.priceId || "";
      const customerId = session.customer as string;

      // Get subscription type from price ID
      const subscriptionType = PRICE_ID_TO_SUBSCRIPTION[priceId] || "free";

      console.log("📥 Processing subscription webhook:", {
        appwriteUserId,
        email: customerEmail,
        subscriptionType,
        priceId,
        subscriptionId,
        customerId,
        metadata: session.metadata,
      });

      // If no Appwrite user ID, we can't link the subscription
      // This should not happen if user is logged in, but handle gracefully
      if (!appwriteUserId) {
        console.warn(
          "No Appwrite user ID in session metadata. Subscription cannot be linked to user.",
        );
        // Still return success to Stripe, but log the issue
        return NextResponse.json({
          received: true,
          warning: "No Appwrite user ID found",
        });
      }

      // Update subscription in Appwrite subscriptions collection
      const databases = getAppwriteClient();
      // Use the same database as trials, but separate collection
      const SUBSCRIPTIONS_DATABASE_ID =
        process.env.NEXT_PUBLIC_APPWRITE_SUBSCRIPTIONS_DATABASE_ID ||
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID; // Fallback to main database
      const SUBSCRIPTIONS_COLLECTION_ID =
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID_SUBSCRIPTIONS ||
        "subscriptions"; // Fallback to default

      console.log("🔍 Webhook configuration:", {
        SUBSCRIPTIONS_DATABASE_ID,
        SUBSCRIPTIONS_COLLECTION_ID,
        hasDatabaseId: !!SUBSCRIPTIONS_DATABASE_ID,
        hasCollectionId: !!SUBSCRIPTIONS_COLLECTION_ID,
      });

      if (!SUBSCRIPTIONS_DATABASE_ID) {
        console.error("❌ NEXT_PUBLIC_APPWRITE_DATABASE_ID is not configured");
        return NextResponse.json(
          { error: "Database not configured" },
          { status: 500 },
        );
      }

      if (!SUBSCRIPTIONS_COLLECTION_ID) {
        console.error(
          "❌ NEXT_PUBLIC_APPWRITE_COLLECTION_ID_SUBSCRIPTIONS is not configured",
        );
        return NextResponse.json(
          { error: "Collection not configured" },
          { status: 500 },
        );
      }

      try {
        const { Query, ID } = await import("node-appwrite");

        // Check if subscription already exists for this Stripe subscription ID
        const existingSubscriptions = await databases.listDocuments(
          SUBSCRIPTIONS_DATABASE_ID,
          SUBSCRIPTIONS_COLLECTION_ID,
          [Query.equal("stripe_subscription_id", subscriptionId)],
        );

        // Get subscription details from Stripe to get period dates
        const subscription = (await stripe.subscriptions.retrieve(
          subscriptionId,
        )) as Stripe.Subscription;

        const subscriptionData: Record<string, any> = {
          appwrite_user_id: appwriteUserId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          stripe_price_id: priceId,
          subscription_type: subscriptionType,
          subscription_status: subscription.status,
          current_period_start: (subscription as any).current_period_start,
          current_period_end: (subscription as any).current_period_end,
          email: customerEmail || "",
        };

        if (existingSubscriptions.documents.length > 0) {
          // Update existing subscription
          const existingSub = existingSubscriptions.documents[0];
          await databases.updateDocument(
            SUBSCRIPTIONS_DATABASE_ID,
            SUBSCRIPTIONS_COLLECTION_ID,
            existingSub.$id,
            subscriptionData,
          );
          console.log("Updated subscription:", existingSub.$id);
        } else {
          // Create new subscription record
          console.log("Creating new subscription with data:", {
            databaseId: SUBSCRIPTIONS_DATABASE_ID,
            collectionId: SUBSCRIPTIONS_COLLECTION_ID,
            subscriptionData,
          });
          const newSubscription = await databases.createDocument(
            SUBSCRIPTIONS_DATABASE_ID,
            SUBSCRIPTIONS_COLLECTION_ID,
            ID.unique(),
            subscriptionData,
          );
          console.log(
            "✅ Created new subscription:",
            newSubscription.$id,
            "for user:",
            appwriteUserId,
          );
        }
      } catch (dbError: any) {
        console.error("❌ Database error creating/updating subscription:", {
          error: dbError.message,
          code: dbError.code,
          type: dbError.type,
          response: dbError.response,
          databaseId: SUBSCRIPTIONS_DATABASE_ID,
          collectionId: SUBSCRIPTIONS_COLLECTION_ID,
        });
        // Don't fail the webhook - log and continue
        // Stripe will retry if we return an error
      }
    } else if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const subscriptionId = subscription.id;
      const customerId = subscription.customer as string;

      // Get customer email from Stripe
      const customer = (await stripe.customers.retrieve(
        customerId,
      )) as Stripe.Customer;
      const customerEmail =
        customer && !customer.deleted ? customer.email : null;

      // Determine subscription status and type
      const priceId = subscription.items.data[0]?.price.id || "";
      const subscriptionType =
        subscription.status === "active"
          ? PRICE_ID_TO_SUBSCRIPTION[priceId] || "free"
          : "free";

      // Update subscription in subscriptions collection
      const databases = getAppwriteClient();
      const SUBSCRIPTIONS_DATABASE_ID =
        process.env.NEXT_PUBLIC_APPWRITE_SUBSCRIPTIONS_DATABASE_ID ||
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID; // Fallback to main database
      const SUBSCRIPTIONS_COLLECTION_ID =
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID_SUBSCRIPTIONS ||
        "subscriptions"; // Fallback to default

      if (SUBSCRIPTIONS_DATABASE_ID) {
        try {
          const { Query } = await import("node-appwrite");

          // Find subscription by Stripe subscription ID
          const existingSubscriptions = await databases.listDocuments(
            SUBSCRIPTIONS_DATABASE_ID,
            SUBSCRIPTIONS_COLLECTION_ID,
            [Query.equal("stripe_subscription_id", subscriptionId)],
          );

          if (existingSubscriptions.documents.length > 0) {
            const existingSub = existingSubscriptions.documents[0];
            await databases.updateDocument(
              SUBSCRIPTIONS_DATABASE_ID,
              SUBSCRIPTIONS_COLLECTION_ID,
              existingSub.$id,
              {
                subscription_status: subscription.status,
                subscription_type: subscriptionType,
                current_period_start: (subscription as any)
                  .current_period_start,
                current_period_end: (subscription as any).current_period_end,
                ...(customerEmail && { email: customerEmail }),
              },
            );
            console.log(
              "Updated subscription status:",
              existingSub.$id,
              subscription.status,
            );
          } else {
            console.warn(
              "Subscription not found for Stripe subscription ID:",
              subscriptionId,
            );
          }
        } catch (dbError: any) {
          console.error("Database error updating subscription:", dbError);
        }
      }
    } else if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const subscriptionId = subscription.id;

      // Update subscription status to canceled in subscriptions collection
      const databases = getAppwriteClient();
      const SUBSCRIPTIONS_DATABASE_ID =
        process.env.NEXT_PUBLIC_APPWRITE_SUBSCRIPTIONS_DATABASE_ID ||
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID; // Fallback to main database
      const SUBSCRIPTIONS_COLLECTION_ID =
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID_SUBSCRIPTIONS ||
        "subscriptions"; // Fallback to default

      if (SUBSCRIPTIONS_DATABASE_ID) {
        try {
          const { Query } = await import("node-appwrite");

          // Find subscription by Stripe subscription ID
          const existingSubscriptions = await databases.listDocuments(
            SUBSCRIPTIONS_DATABASE_ID,
            SUBSCRIPTIONS_COLLECTION_ID,
            [Query.equal("stripe_subscription_id", subscriptionId)],
          );

          if (existingSubscriptions.documents.length > 0) {
            const existingSub = existingSubscriptions.documents[0];
            await databases.updateDocument(
              SUBSCRIPTIONS_DATABASE_ID,
              SUBSCRIPTIONS_COLLECTION_ID,
              existingSub.$id,
              {
                subscription_status: "canceled",
                subscription_type: "free",
              },
            );
            console.log("Marked subscription as canceled:", existingSub.$id);
          } else {
            console.warn(
              "Subscription not found for Stripe subscription ID:",
              subscriptionId,
            );
          }
        } catch (dbError: any) {
          console.error("Database error canceling subscription:", dbError);
        }
      }
    }

    console.log("✅ Webhook processed successfully");
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("❌ Error processing webhook:", {
      message: error.message,
      stack: error.stack,
      eventType: event?.type,
    });
    return NextResponse.json(
      { error: "Webhook processing failed", details: error.message },
      { status: 500 },
    );
  }
}
