"use client";

import { useState, useEffect } from "react";
import { Button } from "../../components/Button";
import LoadingIndicator from "../../components/LoadingIndicator";

interface UserProfile {
  id: string;
  email: string;
  subscription: "ads-free" | "local" | "byok" | "ditectrev";
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setApiKeys(data.apiKeys || {});
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveApiKeys = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/profile/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKeys }),
      });

      if (response.ok) {
        alert("API keys saved successfully!");
        fetchProfile();
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
        body: JSON.stringify({ explanationProvider: provider }),
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

  if (loading) return <LoadingIndicator />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                </div>
                <Button
                  intent="primary"
                  size="medium"
                  onClick={() => (window.location.href = "/pricing")}
                >
                  Upgrade Plan
                </Button>
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
                  {Object.entries(apiKeys).map(([provider, key]) => (
                    <div key={provider} className="flex items-center space-x-4">
                      <label className="w-24 text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {provider}:
                      </label>
                      <div className="flex-1 relative">
                        <input
                          type={
                            showKeys[provider as keyof typeof showKeys]
                              ? "text"
                              : "password"
                          }
                          value={key}
                          onChange={(e) =>
                            setApiKeys((prev) => ({
                              ...prev,
                              [provider]: e.target.value,
                            }))
                          }
                          placeholder={`Enter your ${provider} API key`}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowKeys((prev) => ({
                              ...prev,
                              [provider]: !prev[provider as keyof typeof prev],
                            }))
                          }
                          className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                        >
                          {showKeys[provider as keyof typeof showKeys]
                            ? "🙈"
                            : "👁️"}
                        </button>
                      </div>
                    </div>
                  ))}
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
