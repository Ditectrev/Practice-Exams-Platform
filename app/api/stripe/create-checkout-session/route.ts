import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  try {
    // Diagnostic logging (only log that key exists, not the value)
    const hasStripeKey = !!process.env.STRIPE_SECRET_KEY;
    console.log("Stripe configuration check:", {
      hasStripeKey,
      keyPrefix: hasStripeKey
        ? process.env.STRIPE_SECRET_KEY!.substring(0, 7) + "..."
        : "missing",
    });

    const { priceId } = await request.json();

    // Validate priceId
    if (!priceId || typeof priceId !== "string" || priceId.trim() === "") {
      console.error("Invalid priceId received:", priceId);
      return NextResponse.json(
        { error: "Price ID is required and must be a valid string" },
        { status: 400 },
      );
    }

    // Check for Stripe secret key
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY is not configured");
      return NextResponse.json(
        { error: "Stripe secret key not configured. Please contact support." },
        { status: 500 },
      );
    }

    // Validate Stripe secret key format
    if (
      !process.env.STRIPE_SECRET_KEY.startsWith("sk_") &&
      !process.env.STRIPE_SECRET_KEY.startsWith("sk_test_") &&
      !process.env.STRIPE_SECRET_KEY.startsWith("sk_live_")
    ) {
      console.error("Invalid Stripe secret key format");
      return NextResponse.json(
        { error: "Invalid Stripe configuration" },
        { status: 500 },
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-11-17.clover",
    });

    // Get the base URL for redirects (always use dynamic URL for Azure Static Web Apps)
    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;

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
      metadata: {
        priceId: priceId.trim(),
      },
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
