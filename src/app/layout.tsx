import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/common/ClientProviders";
import { Sidebar } from "@/components/navigation/Sidebar";
import { Header } from "@/components/navigation/Header";
import { MobileNav } from "@/components/navigation/MobileNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SabFitness — Your fitness journey. Your goals.",
  description:
    "A complete, premium fitness application and PWA for workout tracking, nutrition diary, hydration, supplements, progress analytics, and community sharing.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SabFitness",
  },
  icons: {
    icon: "/icons/icon-192x192.svg",
    apple: "/icons/icon-192x192.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased selection:bg-indigo-500/20 relative">
        {/* Full-Page Mountain Landscape Wallpaper at Sunset (Pink, Violet, Blue tones) */}
        <div
          className="fixed inset-0 -z-30 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{ backgroundImage: "url('/images/mountain-sunset.jpg')" }}
          aria-hidden="true"
        />

        {/* Readability & Deep Twilight Overlay */}
        <div
          className="fixed inset-0 -z-20 bg-gradient-to-b from-[#070a18]/70 via-[#0b0e24]/50 to-[#060814]/80 pointer-events-none"
          aria-hidden="true"
        />

        {/* Ambient Glow Orbs for Rich Backdrop Depth */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden" aria-hidden="true">
          <div className="absolute top-10 left-1/4 w-[500px] h-[500px] rounded-full bg-purple-600/15 blur-[140px]" />
          <div className="absolute top-1/3 right-10 w-[400px] h-[400px] rounded-full bg-pink-500/10 blur-[130px]" />
          <div className="absolute -bottom-20 left-10 w-[600px] h-[600px] rounded-full bg-indigo-600/15 blur-[160px]" />
        </div>

        <ClientProviders>
          <div className="flex min-h-screen">
            {/* Desktop Navigation Sidebar */}
            <Sidebar />

            {/* Main Application Area */}
            <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
              <Header />
              <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
                {children}
              </main>
            </div>
          </div>

          {/* Mobile Fixed Bottom Navigation */}
          <MobileNav />
        </ClientProviders>
      </body>
    </html>
  );
}
