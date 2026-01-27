/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    if (!config.experiments) {
      config.experiments = {};
    }
    config.experiments.topLevelAwait = true;
    return config;
  },
  images: {
    domains: ["localhost"],
  },
};

// Only enable PWA in production to avoid dev server issues
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: false, // Disable service worker registration
  skipWaiting: false,
});

module.exports =
  process.env.NODE_ENV === "development" ? nextConfig : withPWA(nextConfig);
