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
 * Metadata for SEO - AfterHoursID
 */
export const metadata: Metadata = {
  title: "AfterHoursID | The Premier Intelligence-Driven Nightlife Protocol",
  description: "Elevate your night. Verified squad bookings, AI-driven vibe discovery, and exclusive VIP access at your fingertips.",
  keywords: ["nightlife", "entertainment", "karaoke", "clubs", "KTV", "spa", "venues", "night out", "after hours", "VIP", "booking"],
  authors: [{ name: "AfterHoursID Team" }],
  openGraph: {
    title: "AfterHoursID | The Premier Intelligence-Driven Nightlife Protocol",
    description: "Elevate your night. Verified squad bookings, AI-driven vibe discovery, and exclusive VIP access at your fingertips.",
    type: "website",
    locale: "en_US",
    siteName: "AfterHoursID",
    url: "https://afterhoursid.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "AfterHoursID | The Premier Intelligence-Driven Nightlife Protocol",
    description: "Elevate your night. Verified squad bookings, AI-driven vibe discovery, and exclusive VIP access at your fingertips.",
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
    "name": "AfterHoursID",
    "description": "Elevate your night. Verified squad bookings, AI-driven vibe discovery, and exclusive VIP access at your fingertips.",
    "url": "https://afterhoursid.com",
    "areaServed": {
      "@type": "Country",
      "name": "Indonesia"
    },
    "serviceType": ["Karaoke", "Club", "Spa", "KTV", "Entertainment"],
    "priceRange": "$",
    "sameAs": [
      "https://instagram.com/afterhoursid",
      "https://twitter.com/afterhoursid"
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
