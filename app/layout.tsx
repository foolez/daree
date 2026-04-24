import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { NativePwaClient } from "@/components/NativePwaClient";

const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://daree.vercel.app";

export const metadata: Metadata = {
  title: "Daree – Dare your friends. Prove yourself.",
  description:
    "Daree is the social challenge app where you create dares, invite friends, post daily proof, and compete on a live leaderboard.",
  metadataBase: new URL(appBaseUrl),
  applicationName: "Daree",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/logo.png" }],
    apple: [{ url: "/logo.png" }]
  },
  alternates: {
    canonical: "/"
  },
  appleWebApp: {
    capable: true,
    title: "Daree",
    statusBarStyle: "black-translucent"
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0A0A0A"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preconnect"
          href={new URL(appBaseUrl).origin}
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href={new URL(appBaseUrl).origin} />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <NativePwaClient />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

