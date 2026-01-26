"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "../../components/Button";
import LoadingIndicator from "../../components/LoadingIndicator";
import { useAuth } from "../../contexts/AuthContext";

interface UserProfile {
  id: string;
  email: string;
  subscription: "free" | "ads-free" | "local" | "byok" | "ditectrev";
  subscriptionExpiresAt?: number; // Unix timestamp for subscription expiration
  apiKeys: {
    openai?: string;
    gemini?: string;
    mistral?: string;
    deepseek?: string;
  };
  preferences: {
    explanationProvider:
      | "ollama"
      | "openai"
      | "gemini"
      | "mistral"
      | "deepseek"
      | "ditectrev";
  };
}

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [apiKeys, setApiKeys] = useState({
    openai: "",
    gemini: "",
    mistral: "",
    deepseek: "",
  });
  const [showKeys, setShowKeys] = useState({
    openai: false,
    gemini: false,
    mistral: false,
    deepseek: false,
  });

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // Check for success parameter from Stripe checkout
    if (searchParams.get("success") === "true") {
      setShowSuccessMessage(true);
      // Clear the URL parameters
      window.history.replaceState({}, "", "/profile");
    }

    // Fetch profile if user is available
    if (user?.email) {
      fetchProfile();

      // If coming from checkout, refresh after delays to allow webhook to process
      if (searchParams.get("success") === "true") {
        setTimeout(() => {
          fetchProfile();
        }, 3000);
        setTimeout(() => {
          fetchProfile();
        }, 5000);
      }
    } else {
      // User not authenticated, stop loading
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user?.email, user?.$id, authLoading]);

  const fetchProfile = async () => {
    try {
      // Get user email and ID from auth context
      const userEmail = user?.email;
      const userId = user?.$id;
      if (!userEmail) {
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        email: userEmail,
        ...(userId && { userId }),
      });
      const response = await fetch(`/api/profile?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setApiKeys(data.apiKeys || {});
      } else {
        console.error("Failed to fetch profile:", response.status);
      }
    } catch (error) {
      console.error("❌ Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveApiKeys = async () => {
    setSaving(true);
    try {
      // Filter out masked keys (keys that start with •) - only send new/changed keys
      const keysToSave: Record<string, string> = {};
      for (const [provider, key] of Object.entries(apiKeys)) {
        if (key && !key.startsWith("••")) {
          keysToSave[provider] = key;
        }
      }

      if (Object.keys(keysToSave).length === 0) {
        alert("No new API keys to save. Enter a key to update it.");
        setSaving(false);
        return;
      }

      const response = await fetch("/api/profile/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKeys: keysToSave,
          userId: user?.$id,
          email: user?.email,
        }),
      });

      if (response.ok) {
        alert("API keys saved successfully!");
        fetchProfile();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save API keys");
      }
    } catch (error) {
      console.error("Error saving API keys:", error);
      alert("Failed to save API keys");
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = async (provider: string) => {
    try {
      const response = await fetch("/api/profile/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          explanationProvider: provider,
          userId: user?.$id,
          email: user?.email,
        }),
      });

      if (response.ok) {
        fetchProfile();
      }
    } catch (error) {
      console.error("Error updating preferences:", error);
    }
  };

  const getSubscriptionBadge = (subscription: string) => {
    const badges = {
      "ads-free": { text: "Ads Free", color: "bg-blue-500" },
      local: { text: "Local Explanations", color: "bg-green-500" },
      byok: { text: "BYOK Explanations", color: "bg-purple-500" },
      ditectrev: { text: "Ditectrev Explanations", color: "bg-gold-500" },
    };

    const badge = badges[subscription as keyof typeof badges] || {
      text: "Free",
      color: "bg-gray-500",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-white text-sm font-medium ${badge.color}`}
      >
        {badge.text}
      </span>
    );
  };

  const canUseProvider = (provider: string) => {
    if (provider === "ollama") return profile?.subscription !== "ads-free";
    if (provider === "ditectrev") return profile?.subscription === "ditectrev";
    if (["openai", "gemini", "mistral", "deepseek"].includes(provider)) {
      return ["byok", "ditectrev"].includes(profile?.subscription || "");
    }
    return false;
  };

  if (authLoading || loading) return <LoadingIndicator />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Payment Successful!
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Your subscription has been activated. You now have access to
                  premium features.
                </p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setShowSuccessMessage(false)}
                  className="text-green-400 hover:text-green-600"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              User Profile
            </h1>
          </div>

          <div className="p-6 space-y-8">
            {/* Subscription Status */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Subscription
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  {getSubscriptionBadge(profile?.subscription || "free")}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {profile?.email}
                  </p>
                  {profile?.subscriptionExpiresAt &&
                    profile?.subscription !== "free" &&
                    profile.subscriptionExpiresAt > 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        Active until:{" "}
                        {new Date(
                          profile.subscriptionExpiresAt * 1000,
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    )}
                </div>
                <div className="flex gap-2">
                  <Button
                    intent="primary"
                    size="medium"
                    onClick={() => (window.location.href = "/pricing")}
                  >
                    Upgrade Plan
                  </Button>
                </div>
              </div>
            </div>

            {/* Explanation Provider Selection */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Explanation Provider
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    id: "ollama",
                    name: "Ollama (Local)",
                    description: "Run locally on your machine",
                  },
                  {
                    id: "openai",
                    name: "OpenAI GPT",
                    description: "Requires your API key",
                  },
                  {
                    id: "gemini",
                    name: "Google Gemini",
                    description: "Requires your API key",
                  },
                  {
                    id: "mistral",
                    name: "Mistral AI",
                    description: "Requires your API key",
                  },
                  {
                    id: "deepseek",
                    name: "DeepSeek",
                    description: "Requires your API key",
                  },
                  {
                    id: "ditectrev",
                    name: "Ditectrev AI",
                    description: "Premium service",
                  },
                ].map((provider) => (
                  <div
                    key={provider.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      profile?.preferences.explanationProvider === provider.id
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                        : "border-gray-200 dark:border-gray-700"
                    } ${
                      !canUseProvider(provider.id)
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    onClick={() =>
                      canUseProvider(provider.id) &&
                      updatePreference(provider.id)
                    }
                  >
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {provider.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {provider.description}
                    </p>
                    {!canUseProvider(provider.id) && (
                      <p className="text-xs text-red-500 mt-1">
                        Upgrade required
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* API Keys Management */}
            {["byok", "ditectrev"].includes(profile?.subscription || "") && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  API Keys Management
                </h2>
                <div className="space-y-4">
                  {Object.entries(apiKeys).map(([provider, key]) => {
                    const providerNames: Record<string, string> = {
                      openai: "OpenAI",
                      gemini: "Google Gemini",
                      mistral: "Mistral AI",
                      deepseek: "DeepSeek",
                    };
                    const displayName = providerNames[provider] || provider;
                    return (
                      <div
                        key={provider}
                        className="flex items-center space-x-4"
                      >
                        <label className="w-28 text-sm font-medium text-gray-700 dark:text-gray-300">
                          {displayName}:
                        </label>
                        <div className="flex-1 relative">
                          <input
                            type={
                              key && !key.startsWith("••")
                                ? showKeys[provider as keyof typeof showKeys]
                                  ? "text"
                                  : "password"
                                : "text"
                            }
                            value={key}
                            onChange={(e) =>
                              setApiKeys((prev) => ({
                                ...prev,
                                [provider]: e.target.value,
                              }))
                            }
                            placeholder={`Enter your ${displayName} API key`}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            readOnly={!!(key && key.startsWith("••"))}
                          />
                          {key && !key.startsWith("••") && (
                            <button
                              type="button"
                              onClick={() =>
                                setShowKeys((prev) => ({
                                  ...prev,
                                  [provider]:
                                    !prev[provider as keyof typeof prev],
                                }))
                              }
                              className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                            >
                              {showKeys[provider as keyof typeof showKeys]
                                ? "🙈"
                                : "👁️"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <Button
                    intent="primary"
                    size="medium"
                    onClick={saveApiKeys}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save API Keys"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
