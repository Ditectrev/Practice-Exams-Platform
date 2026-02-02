"use client";

import { useState } from "react";
import { Button } from "../../components/Button";
import { useAuth } from "../../contexts/AuthContext";

interface PricingTier {
  id: string;
  name: string;
  price: string;
  priceId: string; // Stripe price ID
  features: string[];
  popular?: boolean;
  description: string;
}

const pricingTiers: PricingTier[] = [
  {
    id: "ads-free",
    name: "Ads Free",
    price: "€1.99",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ADS_FREE || "",
    description: "Remove ads and enjoy distraction-free learning",
    features: [
      "Ad-free experience",
      "All practice questions",
      "Progress tracking",
      "Mobile responsive",
    ],
  },
  {
    id: "local",
    name: "Local Explanations",
    price: "€2.99",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_LOCAL || "",
    description: "Get AI explanations using your local Ollama setup",
    features: [
      "Everything in Ads Free",
      "Ollama explanations",
      "Privacy-focused (local AI)",
      "No API costs",
      "Offline explanations",
    ],
  },
  {
    id: "byok",
    name: "BYOK Explanations",
    price: "€4.99",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BYOK || "",
    description: "Bring Your Own Key - Use premium AI with your API keys",
    popular: true,
    features: [
      "Everything in Local",
      "OpenAI GPT integration",
      "Google Gemini support",
      "Mistral AI access",
      "DeepSeek integration",
      "API key management",
      "Multiple AI providers",
    ],
  },
  {
    id: "ditectrev",
    name: "Ditectrev Explanations",
    price: "€9.99",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_DITECTREV || "",
    description: "Premium AI explanations powered by our infrastructure",
    features: [
      "Everything in BYOK",
      "Premium AI models",
      "No API key required",
      "Unlimited explanations",
      "Priority support",
      "Advanced AI features",
      "Custom model fine-tuning",
    ],
  },
].filter((tier) => tier.priceId && tier.priceId.trim() !== "");

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  const handleSubscribe = async (priceId: string, tierId: string) => {
    // Validate priceId before making the request
    if (!priceId || priceId.trim() === "" || priceId === "undefined") {
      console.error("Invalid priceId for tier:", tierId, priceId);
      alert(
        "Configuration error: Price ID is missing. Please contact support.",
      );
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      alert("Please sign in to subscribe. You'll be redirected to sign in.");
      // Optionally redirect to sign in or show auth modal
      return;
    }

    setLoading(tierId);

    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          appwriteUserId: user.$id, // Pass Appwrite user ID to link subscription to logged-in user
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("API error:", data);
        alert(
          data.error ||
            `Failed to start checkout: ${response.status} ${response.statusText}`,
        );
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert(
        error instanceof Error
          ? `Failed to start checkout: ${error.message}`
          : "Failed to start checkout process. Please try again.",
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Unlock the power of AI-powered explanations to accelerate your
            learning journey
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {pricingTiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 transition-all duration-200 hover:shadow-xl ${
                tier.popular
                  ? "border-primary-500 scale-105"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {tier.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {tier.description}
                </p>

                <div className="mb-6">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {tier.price}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    /month
                  </span>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-700 dark:text-gray-300 text-sm">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  intent={tier.popular ? "primary" : "secondary"}
                  size="medium"
                  onClick={() => handleSubscribe(tier.priceId, tier.id)}
                  disabled={
                    loading === tier.id ||
                    !tier.priceId ||
                    tier.priceId.trim() === ""
                  }
                  className="w-full"
                >
                  {loading === tier.id
                    ? "Processing..."
                    : !tier.priceId || tier.priceId.trim() === ""
                    ? "Unavailable"
                    : `Subscribe to ${tier.name}`}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                What&apos;s the difference between BYOK and Ditectrev plans?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                BYOK requires you to provide your own API keys for AI services,
                while Ditectrev includes premium AI access using our
                infrastructure.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Yes, you can upgrade or downgrade your plan at any time. Changes
                take effect at your next billing cycle.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Is Ollama really free with Local plan?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Yes! Ollama runs locally on your machine, so there are no API
                costs. You just need to install Ollama locally.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                We accept all major credit cards, debit cards, and other payment
                methods supported by Stripe.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
