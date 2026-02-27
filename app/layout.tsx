import type { Metadata, Viewport } from "next";
import { Syne, Inter } from "next/font/google";
import "./globals.css";

/**
 * Syne font for headings - Bold, distinctive display font
 * Weight: 700 for headlines
 */
const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

/**
 * Inter font for body text - Clean, readable sans-serif
 * Weight: 400 for body, 500 for emphasis
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

/**
 * Metadata for SEO
 */
export const metadata: Metadata = {
  title: "NightLife | Discover Premium Entertainment Venues",
  description: "Find the best nightlife experiences - Karaoke, Clubs, Spas, KTV and more. Your ultimate guide to premium entertainment venues.",
  keywords: ["nightlife", "entertainment", "karaoke", "clubs", "KTV", "spa", "venues", "night out"],
  authors: [{ name: "NightLife Team" }],
  openGraph: {
    title: "NightLife | Discover Premium Entertainment Venues",
    description: "Find the best nightlife experiences - Karaoke, Clubs, Spas, KTV and more.",
    type: "website",
    locale: "en_US",
    siteName: "NightLife",
  },
  twitter: {
    card: "summary_large_image",
    title: "NightLife | Discover Premium Entertainment Venues",
    description: "Find the best nightlife experiences - Karaoke, Clubs, Spas, KTV and more.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * Viewport configuration for mobile-first design
 * Mobile optimized with 85% focus
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EntertainmentBusiness",
    "name": "NightLife Indonesia",
    "description": "Find the best nightlife experiences - Karaoke, Clubs, Spas, KTV and more. Your ultimate guide to premium entertainment venues in Indonesia.",
    "url": "https://nightlife.id",
    "areaServed": {
      "@type": "Country",
      "name": "Indonesia"
    },
    "serviceType": ["Karaoke", "Club", "Spa", "KTV", "Entertainment"],
    "priceRange": "$$",
    "sameAs": [
      "https://instagram.com/nightlifeid",
      "https://twitter.com/nightlifeid"
    ]
  };

  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${syne.variable} ${inter.variable} antialiased bg-deep-black text-white`}
      >
        {children}
      </body>
    </html>
  );
}
