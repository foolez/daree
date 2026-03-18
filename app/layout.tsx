import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daree – Dare your friends. Prove yourself.",
  description:
    "Daree is the social challenge app where you create dares, invite friends, post daily proof, and compete on a live leaderboard."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        {children}
      </body>
    </html>
  );
}

