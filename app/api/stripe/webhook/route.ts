import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Client, Databases } from "node-appwrite";

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
    // Handle the event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Get customer email and subscription details
      const customerEmail =
        session.customer_email || session.customer_details?.email;
      const subscriptionId = session.subscription as string;
      const priceId = session.metadata?.priceId || "";

      if (!customerEmail) {
        console.error("No customer email in session");
        return NextResponse.json(
          { error: "No customer email found" },
          { status: 400 },
        );
      }

      // Get subscription type from price ID
      const subscriptionType = PRICE_ID_TO_SUBSCRIPTION[priceId] || "free";

      console.log("Processing subscription:", {
        email: customerEmail,
        subscriptionType,
        priceId,
        subscriptionId,
      });

      // Update user subscription in Appwrite
      const databases = getAppwriteClient();
      const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
      const USERS_COLLECTION_ID = "users"; // You may need to adjust this

      if (!DATABASE_ID) {
        console.error("NEXT_PUBLIC_APPWRITE_DATABASE_ID is not configured");
        return NextResponse.json(
          { error: "Database not configured" },
          { status: 500 },
        );
      }

      try {
        // Try to find existing user by email
        const { Query } = await import("node-appwrite");
        const existingUsers = await databases.listDocuments(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          [Query.equal("email", customerEmail)],
        );

        if (existingUsers.documents.length > 0) {
          // Update existing user
          const user = existingUsers.documents[0];
          await databases.updateDocument(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            user.$id,
            {
              subscription: subscriptionType,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscriptionId,
              updated_at: new Date().toISOString(),
            },
          );
          console.log("Updated user subscription:", user.$id);
        } else {
          // Create new user
          await databases.createDocument(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            "unique()",
            {
              email: customerEmail,
              subscription: subscriptionType,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscriptionId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          );
          console.log("Created new user with subscription");
        }
      } catch (dbError: any) {
        console.error("Database error:", dbError);
        // Don't fail the webhook - log and continue
        // Stripe will retry if we return an error
      }
    } else if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Get customer email from Stripe
      const customer = await stripe.customers.retrieve(customerId);
      const customerEmail =
        customer && !customer.deleted ? customer.email : null;

      if (!customerEmail) {
        console.error("No customer email found");
        return NextResponse.json({ received: true });
      }

      // Determine subscription status
      const isActive = subscription.status === "active";
      const priceId = subscription.items.data[0]?.price.id || "";
      const subscriptionType = isActive
        ? PRICE_ID_TO_SUBSCRIPTION[priceId] || "free"
        : "free";

      // Update user subscription
      const databases = getAppwriteClient();
      const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
      const USERS_COLLECTION_ID = "users";

      if (DATABASE_ID) {
        try {
          const { Query } = await import("node-appwrite");
          const existingUsers = await databases.listDocuments(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            [Query.equal("email", customerEmail)],
          );

          if (existingUsers.documents.length > 0) {
            const user = existingUsers.documents[0];
            await databases.updateDocument(
              DATABASE_ID,
              USERS_COLLECTION_ID,
              user.$id,
              {
                subscription: subscriptionType,
                updated_at: new Date().toISOString(),
              },
            );
            console.log("Updated user subscription status:", user.$id);
          }
        } catch (dbError: any) {
          console.error("Database error updating subscription:", dbError);
        }
      }
    } else if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Get customer email from Stripe
      const customer = await stripe.customers.retrieve(customerId);
      const customerEmail =
        customer && !customer.deleted ? customer.email : null;

      if (customerEmail) {
        // Set subscription to free
        const databases = getAppwriteClient();
        const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
        const USERS_COLLECTION_ID = "users";

        if (DATABASE_ID) {
          try {
            const { Query } = await import("node-appwrite");
            const existingUsers = await databases.listDocuments(
              DATABASE_ID,
              USERS_COLLECTION_ID,
              [Query.equal("email", customerEmail)],
            );

            if (existingUsers.documents.length > 0) {
              const user = existingUsers.documents[0];
              await databases.updateDocument(
                DATABASE_ID,
                USERS_COLLECTION_ID,
                user.$id,
                {
                  subscription: "free",
                  updated_at: new Date().toISOString(),
                },
              );
              console.log("Set user subscription to free:", user.$id);
            }
          } catch (dbError: any) {
            console.error("Database error canceling subscription:", dbError);
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
