import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { GooSplashLoader } from "@/components/GooSplashLoader";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GooOS — Unified Operating System for 3DFlow, GOO-Studio & GooPrint",
  description:
    "GooOS: Platform terpadu manajemen konten studio, produksi cetak 3D 3DFlow, dan antrean pencetakan GooPrint.",
  icons: {
    icon: [
      { url: "/brand/favicon.ico" },
      { url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-rose-500/30 selection:text-white">
        <GooSplashLoader />
        {children}
      </body>
    </html>
  );
}
