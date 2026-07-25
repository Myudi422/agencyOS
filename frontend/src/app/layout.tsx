import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/providers/Providers";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import PostComposerModal from "@/components/posts/PostComposerModal";

export const metadata: Metadata = {
  title: "AgencyOS | Enterprise Instagram & Facebook Management Platform",
  description: "Manage hundreds of Instagram Business accounts and Facebook Pages from a unified workspace with Upstash Redis queue engine and Backblaze B2 storage.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#07080c] text-gray-100 antialiased min-h-screen">
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <Header />
              <main className="flex-1 p-6 overflow-y-auto">
                {children}
              </main>
            </div>
          </div>
          <PostComposerModal />
        </Providers>
      </body>
    </html>
  );
}
