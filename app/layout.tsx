import { type ReactNode } from "react";
import { type Metadata, type Viewport } from "next";
import { Philosopher, Lora } from "next/font/google";
import Header from "@practice-tests-exams-platform/components/Header";
import Footer from "@practice-tests-exams-platform/components/Footer";
import ApolloProvider from "@practice-tests-exams-platform/components/ApolloProvider";
import Cookie from "@practice-tests-exams-platform/components/Cookie";
import GoogleAnalytics from "@practice-tests-exams-platform/components/GoogleAnalytics";
import { AuthProvider } from "@practice-tests-exams-platform/contexts/AuthContext";
import { ThemeProvider } from "@practice-tests-exams-platform/contexts/ThemeContext";
import { TrialWarning } from "@practice-tests-exams-platform/components/TrialWarning";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "styles/globals.css";

const philosopher = Philosopher({
  weight: ["400"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-philosopher",
});

const lora = Lora({
  weight: ["400"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lora",
});

export const viewport: Viewport = {
  themeColor: "#3f51b5",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  appleWebApp: {
    capable: true,
    title: "🧪 Practice Tests Exams Platform | Ditectrev",
    statusBarStyle: "black",
  },
  applicationName: "🧪 Practice Tests Exams Platform | Ditectrev",
  authors: [
    {
      name: "Daniel Danielecki",
      url: "https://github.com/danieldanielecki",
    },
  ],
  creator: "Ditectrev",
  description:
    "🎓 Practice Exams (Web) Platform developed by Ditectrev's Community. #Build Your Digital Future with us.",
  formatDetection: { telephone: true },
  icons: [
    {
      rel: "apple-touch-icon",
      type: "image/x-icon",
      url: "/favicon.ico",
    },
    {
      rel: "icon",
      type: "image/x-icon",
      url: "/favicon.ico",
    },
  ],
  keywords: [
    "AWS Exams",
    "Azure Exams",
    "Exams Simulator",
    "GCP Exams",
    "ITIL4 Exams",
    "Practice Tests Exams Platform",
    "Practice Tests Platform",
    "Scrum Exams",
  ],
  manifest: "/manifest.json",
  metadataBase: new URL("https://education.ditectrev.com"),
  openGraph: {
    description:
      "🎓 Practice Exams (Web) Platform developed by Ditectrev's Community. #Build Your Digital Future with us.",
    images: [
      {
        alt: "Ditectrev Logo",
        url: "https://education.ditectrev.com/icons/icon-512x512.png",
        width: 512,
        height: 512,
      },
    ],
    siteName: "🧪 Practice Tests Exams Platform | Ditectrev",
    title: "🧪 Practice Tests Exams Platform | Ditectrev",
    type: "website",
    url: "https://education.ditectrev.com",
  },
  publisher: "Ditectrev",
  referrer: "strict-origin-when-cross-origin",
  robots: {
    follow: true,
    index: true,
  },
  title: {
    default: "🧪 Practice Tests Exams Platform | Ditectrev",
    template: "🧪 Practice Tests Exams Platform | Ditectrev",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@ditectrev",
    description:
      "🎓 Practice Exams (Web) Platform developed by Ditectrev's Community. #Build Your Digital Future with us.",
    images: [
      {
        alt: "Ditectrev Logo",
        url: "https://education.ditectrev.com/icons/icon-512x512.png",
      },
    ],
    site: "@ditectrev",
    title: "🧪 Practice Tests Exams Platform | Ditectrev",
  },
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${lora.className} ${philosopher.variable} bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200`}
      >
        <ThemeProvider>
          <ApolloProvider>
            <AuthProvider>
              <Header />
              <main className="flex flex-col justify-between min-h-[calc(100vh-4rem)]">
                {children}
                <Footer />
                <Cookie />
                <GoogleAnalytics />
                <TrialWarning />
              </main>
            </AuthProvider>
          </ApolloProvider>
        </ThemeProvider>
      </body>
      <Analytics />
      <SpeedInsights />
    </html>
  );
}
