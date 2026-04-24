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

// Viewport and theme are set explicitly in <head> below (viewport-fit, PWA) to avoid duplicate meta.

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
        />
        <link
          rel="preconnect"
          href={new URL(appBaseUrl).origin}
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href={new URL(appBaseUrl).origin} />
      </head>
      <body className="bg-slate-950 text-slate-50">
        <NativePwaClient />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
