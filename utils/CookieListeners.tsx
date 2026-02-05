"use client";

import { acceptedCategory } from "vanilla-cookieconsent";

declare global {
  interface Window {
    _ccRun: boolean;
    gtag: any;
    dataLayer: Record<string, unknown>[];
  }
}

const addCookieConsentListeners = () => {
  /**
   * React specific fix: avoid adding event listeners twice
   */
  if (window._ccRun) return;

  const updateGtagConsent = () => {
    if (typeof window.gtag !== "function") return;
    window.gtag("consent", "update", {
      analytics_storage: acceptedCategory("analytics") ? "granted" : "denied",
      security_storage: "granted", //necessary
    });
  };

  window.addEventListener("cc:onConsent", () => {
    updateGtagConsent();
  });

  window.addEventListener("cc:onChange", () => {
    updateGtagConsent();
  });
};

export default addCookieConsentListeners;
