"use client";
import { useEffect, type FC } from "react";
import "vanilla-cookieconsent/dist/cookieconsent.css";
import * as CookieConsent from "vanilla-cookieconsent";
import getConfig from "@azure-fundamentals/utils/CookieConfig";
import addCookieConsentListeners from "@azure-fundamentals/utils/CookieListeners";
import { useTheme } from "../contexts/ThemeContext";
import Script from "next/script";

const Cookie: FC = () => {
  const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_TRACKING_ID;
  const { theme } = useTheme();

  useEffect(() => {
    addCookieConsentListeners();
    CookieConsent.run(getConfig());
  }, []);

  const handleShowPreferences = () => {
    if (CookieConsent && typeof CookieConsent.showPreferences === "function") {
      CookieConsent.showPreferences();
    }
  };

  return (
    <>
      <button
        className={`w-fit self-center md:fixed p-2 rounded-2xl md:bottom-1 md:left-1 ${
          theme === "dark" ? "bg-white" : "bg-black"
        }`}
        type="button"
        onClick={handleShowPreferences}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill={theme === "dark" ? "black" : "white"}
          viewBox="0 0 16 16"
        >
          <path d="M6 7.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m4.5.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3m-.5 3.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0" />
          <path d="M8 0a7.96 7.96 0 0 0-4.075 1.114q-.245.102-.437.28A8 8 0 1 0 8 0m3.25 14.201a1.5 1.5 0 0 0-2.13.71A7 7 0 0 1 8 15a6.97 6.97 0 0 1-3.845-1.15 1.5 1.5 0 1 0-2.005-2.005A6.97 6.97 0 0 1 1 8c0-1.953.8-3.719 2.09-4.989a1.5 1.5 0 1 0 2.469-1.574A7 7 0 0 1 8 1c1.42 0 2.742.423 3.845 1.15a1.5 1.5 0 1 0 2.005 2.005A6.97 6.97 0 0 1 15 8c0 .596-.074 1.174-.214 1.727a1.5 1.5 0 1 0-1.025 2.25 7 7 0 0 1-2.51 2.224Z" />
        </svg>
      </button>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
      />
      <Script id="google-analytics">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('consent', 'default', {'analytics_storage':'denied'})
          gtag('config', '${GA_TRACKING_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
};

export default Cookie;
