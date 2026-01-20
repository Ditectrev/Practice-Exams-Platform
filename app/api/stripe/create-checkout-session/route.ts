import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  try {
    const { priceId, appwriteUserId } = await request.json();

    // Validate priceId
    if (!priceId || typeof priceId !== "string" || priceId.trim() === "") {
      console.error("Invalid priceId received:", priceId);
      return NextResponse.json(
        { error: "Price ID is required and must be a valid string" },
        { status: 400 },
      );
    }

    // Check for Stripe secret key
    // Note: Using NEXT_PUBLIC_ prefix is required for Azure Static Web Apps runtime access
    // This is safe because it's only used in server-side API routes, never in client components
    const stripeSecretKey = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not configured");
      return NextResponse.json(
        { error: "Stripe secret key not configured. Please contact support." },
        { status: 500 },
      );
    }

    // Validate Stripe secret key format
    if (
      !stripeSecretKey.startsWith("sk_") &&
      !stripeSecretKey.startsWith("sk_test_") &&
      !stripeSecretKey.startsWith("sk_live_")
    ) {
      console.error("Invalid Stripe secret key format");
      return NextResponse.json(
        { error: "Invalid Stripe configuration" },
        { status: 500 },
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-11-17.clover",
    });

    // Get the base URL for redirects
    // Azure Static Web Apps may use internal hostnames, so we need to check headers
    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
    const referer = request.headers.get("referer");

    let baseUrl: string;

    if (forwardedHost) {
      // Use forwarded host from Azure Static Web Apps
      baseUrl = `${forwardedProto}://${forwardedHost}`;
    } else if (referer) {
      // Fallback to referer URL
      try {
        const refererUrl = new URL(referer);
        baseUrl = `${refererUrl.protocol}//${refererUrl.host}`;
      } catch {
        // If referer parsing fails, use the request URL
        baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
      }
    } else {
      // Last resort: use request URL (may be internal hostname)
      baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    }

    // Log for debugging
    console.log("Base URL for Stripe redirects:", baseUrl);

    console.log("💳 Creating checkout session:", {
      priceId: priceId.trim(),
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId.trim(),
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/profile?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: "required",
      customer_email: request.headers.get("x-user-email") || undefined, // Get from auth header if available
      metadata: {
        priceId: priceId.trim(),
        ...(appwriteUserId && { appwriteUserId: appwriteUserId.trim() }), // Include Appwrite user ID if provided
      },
    });

    console.log("✅ Checkout session created:", {
      sessionId: session.id,
      metadata: session.metadata,
    });

    if (!session.url) {
      throw new Error("Failed to create checkout session URL");
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    // Log full error details for debugging
    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    };
    console.error("Error creating checkout session:", errorDetails);

    // Handle specific Stripe errors
    if (error instanceof Stripe.errors.StripeError) {
      const stripeErrorDetails = {
        type: error.type,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        raw: error.raw,
      };
      console.error("Stripe API error:", stripeErrorDetails);
      return NextResponse.json(
        {
          error: `Stripe error: ${error.message}`,
          type: error.type,
          code: error.code,
          statusCode: error.statusCode,
        },
        { status: error.statusCode || 400 },
      );
    }

    // Handle other errors - return more details for debugging
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Unexpected error:", errorMessage, error);

    // Return detailed error in response for debugging (safe to expose in staging)
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        message: errorMessage,
        details:
          process.env.NODE_ENV !== "production" ? errorDetails : undefined,
      },
      { status: 500 },
    );
  }
}
