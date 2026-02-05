"use client";

import Script from "next/script";
import { type FC } from "react";

const GoogleAnalytics: FC = () => {
  const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_TRACKING_ID?.trim();
  if (!GA_TRACKING_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('consent', 'default', {'analytics_storage':'denied'});
          gtag('config', '${GA_TRACKING_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
};

export default GoogleAnalytics;
