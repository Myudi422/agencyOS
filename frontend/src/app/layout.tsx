import type { Metadata } from "next";
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
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen">
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  );
}
