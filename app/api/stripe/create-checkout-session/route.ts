import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { priceId } = await request.json();

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Stripe secret key not configured");
    }

    // TODO: Initialize Stripe
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    //   apiVersion: '2023-10-16',
    // });

    // TODO: Get user from authentication context
    // const userId = await getCurrentUserId(request);

    // TODO: Create Stripe checkout session
    // const session = await stripe.checkout.sessions.create({
    //   mode: 'subscription',
    //   payment_method_types: ['card'],
    //   line_items: [
    //     {
    //       price: priceId,
    //       quantity: 1,
    //     },
    //   ],
    //   success_url: `${process.env.NEXT_PUBLIC_URL}/profile?success=true`,
    //   cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing?canceled=true`,
    //   client_reference_id: userId,
    // });

    // For now, return a mock URL
    const mockCheckoutUrl = `/profile?mock_checkout=true&price_id=${priceId}`;

    return NextResponse.json({ url: mockCheckoutUrl });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
