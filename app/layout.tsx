import { type ReactNode } from "react";
import { type Metadata, type Viewport } from "next";
import TopNav from "@azure-fundamentals/components/TopNav";
import Footer from "@azure-fundamentals/components/Footer";
import ApolloProvider from "@azure-fundamentals/components/ApolloProvider";
import Cookie from "@azure-fundamentals/components/Cookie";
import "styles/globals.css";

export const viewport: Viewport = {
  themeColor: "#3f51b5",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  appleWebApp: {
    capable: true,
    title: "🧪 Practice Exams Platform | Ditectrev",
    statusBarStyle: "black",
  },
  applicationName: "🧪 Practice Exams Platform | Ditectrev",
  authors: [
    {
      name: "Daniel Danielecki",
      url: "https://github.com/danieldanielecki",
    },
    {
      name: "Eduard-Constantin Ibinceanu",
      url: "https://github.com/eduardconstantin",
    },
  ],
  creator: "Eduard-Constantin Ibinceanu",
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
    "Practice Exams Platform",
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
        url: "/logo.svg",
      },
    ],
    siteName: "🧪 Practice Exams Platform | Ditectrev",
    title: "🧪 Practice Exams Platform | Ditectrev",
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
    default: "🧪 Practice Exams Platform | Ditectrev",
    template: "🧪 Practice Exams Platform | Ditectrev",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@ditectrev",
    description:
      "🎓 Practice Exams (Web) Platform developed by Ditectrev's Community. #Build Your Digital Future with us.",
    images: [
      {
        alt: "Ditectrev Logo",
        url: "/logo.svg",
      },
    ],
    site: "@ditectrev",
    title: "🧪 Practice Exams Platform | Ditectrev",
  },
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="bg-slate-900">
        <ApolloProvider>
          <TopNav />
          <main className="flex flex-col justify-between md:h-[calc(100vh-2.5rem-64px)] h-full">
            {children}
            <Footer />
            <Cookie />
          </main>
        </ApolloProvider>
      </body>
    </html>
  );
}
