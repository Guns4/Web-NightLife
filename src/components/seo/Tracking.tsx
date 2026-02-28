'use client';

import Script from 'next/script';

interface TrackingConfig {
  gtmId?: string;
  ga4Id?: string;
  metaPixelId?: string;
}

/**
 * Google Tag Manager Component
 */
export function GoogleTagManager({ gtmId }: { gtmId: string }) {
  if (!gtmId) return null;

  return (
    <Script id="gtm-head" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`}
    </Script>
  );
}

/**
 * Google Tag Manager No-Script (for head)
 */
export function GoogleTagManagerNoScript({ gtmId }: { gtmId: string }) {
  if (!gtmId) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  );
}

/**
 * GA4 Page View Tracker
 */
export function GA4PageView({ gaId }: { gaId: string }) {
  if (!gaId) return null;

  return (
    <Script id="ga4-pageview" strategy="afterInteractive">
      {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaId}', {
          page_path: window.location.pathname,
        });
      `}
    </Script>
  );
}

/**
 * Meta (Facebook) Pixel
 */
export function MetaPixel({ pixelId }: { pixelId: string }) {
  if (!pixelId) return null;

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${pixelId}');
        fbq('track', 'PageView');
      `}
    </Script>
  );
}

/**
 * Combined Tracking Component
 */
export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  const ga4Id = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <>
      {/* Google Tag Manager */}
      {gtmId && <GoogleTagManager gtmId={gtmId} />}

      {/* GA4 */}
      {ga4Id && <GA4PageView gaId={ga4Id} />}

      {/* Meta Pixel */}
      {metaPixelId && <MetaPixel pixelId={metaPixelId} />}

      {children}
    </>
  );
}

/**
 * Analytics Event Tracking Hook
 */
export const trackEvent = (
  eventName: string,
  parameters?: Record<string, string | number | boolean>
) => {
  // GA4 Event
  if (typeof window !== 'undefined' && (window as unknown as { gtag?: (event: string, action: string, params?: Record<string, unknown>) => void }).gtag) {
    (window as unknown as { gtag: (event: string, action: string, params?: Record<string, unknown>) => void }).gtag('event', eventName, parameters);
  }

  // Meta Pixel Event
  if (typeof window !== 'undefined' && (window as unknown as { fbq?: (event: string, action: string, params?: Record<string, unknown>) => void }).fbq) {
    (window as unknown as { fbq: (event: string, action: string, params?: Record<string, unknown>) => void }).fbq('track', eventName, parameters);
  }

  // Data Layer for GTM
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({ event: eventName, ...parameters });
  }
};

// Declare global dataLayer
declare global {
  interface Window {
    dataLayer: Array<Record<string, unknown>>;
    gtag: (event: string, action: string, params?: Record<string, unknown>) => void;
    fbq: (event: string, action: string, params?: Record<string, unknown>) => void;
  }
}

/**
 * Predefined Conversion Events
 */
export const ConversionEvents = {
  // Booking Events
  CLICK_WHATSAPP_BOOKING: 'click_whatsapp_booking',
  BOOKING_INITIATED: 'booking_initiated',
  BOOKING_COMPLETED: 'booking_completed',
  
  // Promo Events
  CLAIM_PROMO: 'claim_promo',
  Promo_VIEW: 'promo_view',
  Promo_CLICK: 'promo_click',
  
  // User Events
  SIGN_UP: 'sign_up',
  LOGIN: 'login',
  LOGOUT: 'logout',
  
  // Discovery Events
  VENUE_VIEW: 'venue_view',
  VENUE_SEARCH: 'venue_search',
  VENUE_DIRECTION: 'venue_direction',
  
  // Engagement Events
  REVIEW_SUBMITTED: 'review_submitted',
  SHARE_SOCIAL: 'share_social',
  
  // E-commerce Events
  ADD_TO_WISHLIST: 'add_to_wishlist',
  REMOVE_FROM_WISHLIST: 'remove_from_wishlist',
};

/**
 * Track WhatsApp Booking Click
 */
export function trackWhatsAppClick(venueName: string, venueCity: string) {
  trackEvent(ConversionEvents.CLICK_WHATSAPP_BOOKING, {
    venue_name: venueName,
    venue_city: venueCity,
  });
}

/**
 * Track Promo Claim
 */
export function trackPromoClaim(promoId: string, promoTitle: string, discount: number) {
  trackEvent(ConversionEvents.CLAIM_PROMO, {
    promo_id: promoId,
    promo_title: promoTitle,
    discount_percentage: discount,
  });
}

/**
 * Track Venue View
 */
export function trackVenueView(venueId: string, venueName: string, category: string, city: string) {
  trackEvent(ConversionEvents.VENUE_VIEW, {
    venue_id: venueId,
    venue_name: venueName,
    venue_category: category,
    venue_city: city,
  });
}

/**
 * Track Sign Up
 */
export function trackSignUp(method: string) {
  trackEvent(ConversionEvents.SIGN_UP, {
    sign_up_method: method,
  });
}

/**
 * Track Review Submission
 */
export function trackReviewSubmit(venueId: string, rating: number) {
  trackEvent(ConversionEvents.REVIEW_SUBMITTED, {
    venue_id: venueId,
    rating: rating,
  });
}
