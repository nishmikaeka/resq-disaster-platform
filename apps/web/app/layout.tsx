import type { Metadata } from "next";
// --- Replaced localFont with googleFont imports ---
import { Montserrat, Outfit } from "next/font/google";
import "./globals.css";

// 1. Define Montserrat (Intended as the primary/global font)
const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
  // You can specify weights if you don't need the whole range:
  // weights: [400, 700],
});

// 2. Define Outfit (For specialized use, like headings)
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
      <body className={`${montserrat.variable} ${outfit.variable}`}>
        {children}
      </body>
    </html>
  );
}
