import Script from 'next/script';

interface LocalBusinessSchema {
  name: string;
  description?: string;
  url?: string;
  telephone?: string;
  priceRange?: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry: string;
  };
  geo: {
    latitude: number;
    longitude: number;
  };
  openingHours?: string[];
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
    bestRating?: number;
    worstRating?: number;
  };
  image?: string[];
  servesCuisine?: string[];
  paymentAccepted?: string;
  currenciesAccepted?: string;
}

interface EventSchema {
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  eventStatus?: 'eventScheduled' | 'eventPostponed' | 'eventCancelled' | 'eventMovedOnline';
  eventAttendanceMode?: 'offlineEventAttendanceMode' | 'onlineEventAttendanceMode' | 'mixedEventAttendanceMode';
  location: {
    name: string;
    address?: string;
    url?: string;
  };
  image?: string;
  organizer?: {
    name: string;
    url?: string;
  };
  offers?: {
    price: number;
    priceCurrency: string;
    availability?: 'https://schema.org/InStock' | 'https://schema.org/OutOfStock';
    validFrom?: string;
    url?: string;
  }[];
  performer?: string;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * JSON-LD Schema for LocalBusiness/NightClub
 */
export function LocalBusinessSchema({ data }: { data: LocalBusinessSchema }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'NightClub',
    ...data,
  };

  return (
    <Script
      id="ld-local-business"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * JSON-LD Schema for Events
 */
export function EventSchema({ data }: { data: EventSchema }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    ...data,
  };

  return (
    <Script
      id="ld-event"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * JSON-LD Breadcrumb Schema
 */
export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <Script
      id="ld-breadcrumb"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * JSON-LD FAQ Schema
 */
export function FAQSchema({ questions }: { questions: { question: string; answer: string }[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };

  return (
    <Script
      id="ld-faq"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * JSON-LD Organization Schema
 */
export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AfterHoursID',
    url: 'https://afterhours.id',
    logo: 'https://afterhours.id/logo.png',
    description: 'Platform hiburan malam terbesar di Indonesia. Temukan club, bar, karaoke, dan venue hiburan malam terbaik di kota Anda.',
    sameAs: [
      'https://instagram.com/afterhoursid',
      'https://twitter.com/afterhoursid',
      'https://facebook.com/afterhoursid',
      'https://youtube.com/@afterhoursid',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+6281234567890',
      contactType: 'customer service',
      availableLanguage: ['Indonesian', 'English'],
    },
    areaServed: {
      '@type': 'Country',
      name: 'Indonesia',
    },
    serviceType: 'Nightlife Discovery Platform',
  };

  return (
    <Script
      id="ld-organization"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * JSON-LD Website Schema with Search
 */
export function WebsiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AfterHoursID',
    url: 'https://afterhours.id',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://afterhours.id/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <Script
      id="ld-website"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Helper to generate venue schema from venue data
 */
export function generateVenueSchema(venue: {
  name: string;
  description?: string | null;
  city: string;
  address?: string | null;
  latitude?: number;
  longitude?: number;
  priceRange?: number | null;
  rating?: number | null;
  reviewCount?: number;
  image?: string | null;
  category?: string;
  openingHours?: Record<string, { open: string; close: string }> | null;
  phone?: string;
  website?: string;
}): LocalBusinessSchema {
  const categoryType = getSchemaCategory(venue.category || 'club');
  
  const openingHoursFormatted = venue.openingHours 
    ? Object.entries(venue.openingHours).map(([day, hours]) => {
        const dayMap: Record<string, string> = {
          monday: 'Mo',
          tuesday: 'Tu',
          wednesday: 'We',
          thursday: 'Th',
          friday: 'Fr',
          saturday: 'Sa',
          sunday: 'Su',
        };
        return `${dayMap[day.toLowerCase()] || day} ${hours.open}-${hours.close}`;
      })
    : undefined;

  return {
    name: venue.name,
    description: venue.description || undefined,
    url: venue.website,
    telephone: venue.phone,
    priceRange: venue.priceRange ? '$'.repeat(venue.priceRange) : undefined,
    address: {
      streetAddress: venue.address || '',
      addressLocality: venue.city,
      addressCountry: 'ID',
    },
    geo: {
      latitude: venue.latitude || -6.2,
      longitude: venue.longitude || 106.8,
    },
    openingHours: openingHoursFormatted,
    aggregateRating: venue.rating ? {
      ratingValue: venue.rating,
      reviewCount: venue.reviewCount || 0,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
    image: venue.image ? [venue.image] : undefined,
  };
}

function getSchemaCategory(category: string): string {
  const typeMap: Record<string, string> = {
    club: 'NightClub',
    bar: 'Bar',
    karaoke: 'BarOrPub',
    KTV: 'BarOrPub',
    spa: 'HealthAndBeautyBusiness',
    restaurant: 'Restaurant',
    lounge: 'NightClub',
    rooftop: 'NightClub',
    beach_club: 'Beach',
  };
  
  return typeMap[category.toLowerCase()] || 'LocalBusiness';
}

/**
 * Helper to generate event schema from promo/event data
 */
export function generateEventSchema(event: {
  name: string;
  description?: string;
  venueName: string;
  venueCity?: string;
  venueAddress?: string;
  startDate: string;
  endDate?: string;
  image?: string;
  organizerName?: string;
  organizerUrl?: string;
  price?: number;
  currency?: string;
  url?: string;
}): EventSchema {
  return {
    name: event.name,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    eventStatus: 'eventScheduled',
    eventAttendanceMode: 'offlineEventAttendanceMode',
    location: {
      name: event.venueName,
      address: event.venueAddress || event.venueCity || '',
    },
    image: event.image,
    organizer: event.organizerName ? {
      name: event.organizerName,
      url: event.organizerUrl,
    } : undefined,
    offers: event.price !== undefined ? [{
      price: event.price,
      priceCurrency: event.currency || 'IDR',
      availability: 'https://schema.org/InStock',
      validFrom: event.startDate,
      url: event.url,
    }] : undefined,
  };
}
