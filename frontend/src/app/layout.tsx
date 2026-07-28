import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Providers from "@/components/providers/Providers";
import AppLayout from "@/components/layout/AppLayout";

export const metadata: Metadata = {
  title: "AgencyOS AI | Enterprise Social Media Command Center",
  description: "Unified multi-platform social media orchestration platform for Instagram, Facebook, X, TikTok, YouTube, Pinterest, LinkedIn, Bluesky, & Threads.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "SB-Mid-client-Hq-oZXhBhWzOSZzD"}
          strategy="lazyOnload"
        />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen">
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  );
}
