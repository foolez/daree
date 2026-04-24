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
          content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="theme-color" content="#0A0A0A" />
        <link
          rel="preconnect"
          href={new URL(appBaseUrl).origin}
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href={new URL(appBaseUrl).origin} />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <div
          id="splash"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "#0A0A0A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999
          }}
        >
          <img
            src="/logo.png"
            alt="Daree"
            width={80}
            height={80}
            style={{ animation: "pulse 1.5s ease-in-out infinite" }}
          />
        </div>
        <style
          dangerouslySetInnerHTML={{
            __html:
              "@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.7;transform:scale(0.95)}}"
          }}
        />
        <NativePwaClient />
        <ToastProvider>{children}</ToastProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
    window.addEventListener('load', function() {
      setTimeout(function() {
        var s = document.getElementById('splash');
        if(s){s.style.transition='opacity 0.3s';s.style.opacity='0';setTimeout(function(){s.remove()},300)}
      }, 300);
    });
  `
          }}
        />
      </body>
    </html>
  );
}
