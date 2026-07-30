import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Providers from "@/components/providers/Providers";
import AppLayout from "@/components/layout/AppLayout";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://shiera.web.id"),
  title: {
    default: "Shiera | Kelola Sosmed Dalam Satu Tempat - Platform SMM #1 Indonesia",
    template: "%s | Shiera"
  },
  description: "Shiera adalah platform otomatisasi & penjadwalan sosial media multi-channel #1 di Indonesia (Instagram, TikTok, Facebook, LinkedIn, YouTube, X, Threads, Bluesky). Hemat 15+ jam kerja per minggu!",
  keywords: [
    "Shiera",
    "Shiera AI",
    "Social Media Management Indonesia",
    "Auto Post Instagram",
    "Auto Post TikTok",
    "Social Media Scheduler",
    "KOL Campaign Tracker",
    "White Label PDF Report",
    "Kelola Sosmed",
    "Aplikasi Schedule Sosmed"
  ],
  authors: [{ name: "Shiera Inc.", url: "https://shiera.web.id" }],
  creator: "Shiera",
  publisher: "Shiera Inc.",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "android-chrome-192x192",
        url: "/android-chrome-192x192.png",
      },
      {
        rel: "android-chrome-512x512",
        url: "/android-chrome-512x512.png",
      },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Shiera | Kelola Sosmed Dalam Satu Tempat - Platform SMM #1 Indonesia",
    description: "Posting sosmed sekaligus ke semua akun tanpa ribet upload manual. Jadwalkan postingan Instagram, TikTok, FB, LinkedIn, YT & X dalam 1 tempat.",
    url: "https://shiera.web.id",
    siteName: "Shiera",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Shiera Logo - Social Media Management Engine",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shiera | Kelola Sosmed Dalam Satu Tempat",
    description: "Platform otomatisasi sosmed multi-channel terbaik untuk Creator, Olshop, & Digital Agency.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://shiera.web.id",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://shiera.web.id/#organization",
      "name": "Shiera",
      "url": "https://shiera.web.id",
      "logo": {
        "@type": "ImageObject",
        "url": "https://shiera.web.id/logo.png"
      },
      "description": "Platform Social Media Management #1 di Indonesia untuk otomatisasi dan penjadwalan konten multi-channel."
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://shiera.web.id/#software",
      "name": "Shiera Engine",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "All",
      "url": "https://shiera.web.id",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "IDR"
      },
      "description": "Kelola dan jadwalkan postingan ke Instagram, TikTok, Facebook, LinkedIn, YouTube, X, Threads, dan Bluesky sekaligus."
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <meta name="theme-color" content="#7c3aed" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
