import type { Metadata } from "next";
// --- Replaced localFont with googleFont imports ---
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

// 1. Define Montserrat (Intended as the primary/global font)
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "ResQ - Disaster Reporting", // Updated title
  description:
    "Report emergencies instantly and connect with local volunteers.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Apply the new font variables to the body tag.
        We will use Tailwind configuration to make 'montserrat' the global default.
      */}
      <body className={`${inter.variable} ${outfit.variable}`}>{children}</body>
    </html>
  );
}
