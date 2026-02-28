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
  metadataBase: new URL('https://afterhours.id'),
  title: {
    default: "AfterHoursID | Platform Hiburan Malam Terbesar Indonesia",
    template: "%s | AfterHoursID",
  },
  description: "Temukan club, bar, karaoke, spa, dan venue hiburan malam terbaik di Indonesia. Reservasi mudah, promo eksklusif, dan pengalaman malam yang tak terlupakan.",
  keywords: [
    "nightlife",
    "entertainment",
    "karaoke",
    "clubs",
    "KTV",
    "spa",
    "venues",
    "night out",
    "after hours",
    "VIP",
    "booking",
    "hiburan malam",
    " jakarta",
    "bali",
    " Indonesia",
    "reservasi",
    "pesta",
    "club jakarta",
    "bar jakarta",
    "karaoke jakarta",
  ],
  authors: [{ name: "AfterHoursID Team" }],
  creator: "AfterHoursID",
  publisher: "AfterHoursID",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "AfterHoursID | Platform Hiburan Malam Terbesar Indonesia",
    description: "Temukan club, bar, karaoke, spa, dan venue hiburan malam terbaik di Indonesia. Reservasi mudah dan promo eksklusif.",
    url: "https://afterhours.id",
    siteName: "AfterHoursID",
    locale: "id_ID",
    alternateLocale: "en_US",
    type: "website",
    countryName: "Indonesia",
    images: [
      {
        url: "https://afterhours.id/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "AfterHoursID - Platform Hiburan Malam Indonesia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AfterHoursID | Platform Hiburan Malam Terbesar Indonesia",
    description: "Temukan club, bar, karaoke, spa, dan venue hiburan malam terbaik di Indonesia.",
    images: ["https://afterhours.id/og-image.jpg"],
    creator: "@afterhoursid",
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
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
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
    "description": "Platform hiburan malam terbesar di Indonesia. Temukan club, bar, karaoke, spa, dan venue hiburan malam terbaik.",
    "url": "https://afterhours.id",
    "areaServed": {
      "@type": "Country",
      "name": "Indonesia"
    },
    "serviceType": ["Karaoke", "Club", "Spa", "KTV", "Entertainment", "Bar", "Lounge"],
    "priceRange": "$$",
    "sameAs": [
      "https://instagram.com/afterhoursid",
      "https://twitter.com/afterhoursid",
      "https://facebook.com/afterhoursid",
      "https://youtube.com/@afterhoursid"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+6281234567890",
      "contactType": "customer service",
      "availableLanguage": ["Indonesian", "English"]
    }
  };

  // Google Tag Manager ID
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  return (
    <html lang="id" className="dark">
      <head>
        {/* Google Tag Manager */}
        {gtmId && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${gtmId}');
              `
            }}
          />
        )}

        {/* JSON-LD Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>

      <body
        className={`${syne.variable} ${inter.variable} antialiased bg-deep-black text-white`}
      >
        {/* Google Tag Manager No-Script */}
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}

        {children}
      </body>
    </html>
  );
}
