import { Metadata } from 'next';

// Category mapping for Indonesian SEO
const categoryMap: Record<string, string> = {
  club: 'Club',
  bar: 'Bar',
  karaoke: 'Karaoke',
  KTV: 'Karaoke',
  spa: 'Spa',
  restaurant: 'Restaurant',
  lounge: 'Lounge',
  rooftop: 'Rooftop',
  beach_club: 'Beach Club',
};

// City mapping for proper display
const cityMap: Record<string, string> = {
  jakarta: 'Jakarta',
  bali: 'Bali',
  surabaya: 'Surabaya',
  bandung: 'Bandung',
  yogya: 'Yogyakarta',
  yogyakarta: 'Yogyakarta',
  semarang: 'Semarang',
  medan: 'Medan',
  makassar: 'Makassar',
};

interface VenueSEOParams {
  name: string;
  category: string;
  city: string;
  description?: string | null;
  rating?: number | null;
  imageUrl?: string | null;
}

interface PromoSEOParams {
  title: string;
  description: string;
  venueName?: string;
  venueCity?: string;
  discount?: number;
  startDate?: string;
  endDate?: string;
  imageUrl?: string;
}

interface EventSEOParams {
  name: string;
  description: string;
  venueName?: string;
  venueCity?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  imageUrl?: string;
  price?: string;
}

/**
 * Generate SEO metadata for Venue pages
 */
export function generateVenueMetadata({
  name,
  category,
  city,
  description,
  rating,
  imageUrl,
}: VenueSEOParams): Metadata {
  const normalizedCategory = categoryMap[category.toLowerCase()] || category;
  const normalizedCity = cityMap[city.toLowerCase()] || city;
  
  const title = `${name} - ${normalizedCategory} Terbaik di ${normalizedCity} | AfterHoursID`;
  
  const metaDescription = description 
    ? `${name} adalah ${normalizedCategory.toLowerCase()} terbaik di ${normalizedCity}. ${description.substring(0, 150)}`
    : `${name} - Temukan ${normalizedCategory.toLowerCase()} terbaik di ${normalizedCity} di AfterHoursID. Info lengkap, promo, dan reservasi.`;
  
  const keywords: string[] = [
    name,
    `${normalizedCategory} ${normalizedCity}`,
    `${normalizedCategory} terbaik ${normalizedCity}`,
    'afterhours',
    'nightlife',
    'hiburan malam',
    'reservasi',
    'booking',
  ];

  const images = imageUrl ? [
    {
      url: imageUrl,
      width: 1200,
      height: 630,
      alt: `${name} - ${normalizedCategory} di ${normalizedCity}`,
    },
  ] : [];

  return {
    title,
    description: metaDescription,
    keywords,
    openGraph: {
      title,
      description: metaDescription,
      type: 'website' as const,
      url: `https://afterhours.id/venue/${name.toLowerCase().replace(/\s+/g, '-')}`,
      siteName: 'AfterHoursID',
      locale: 'id_ID',
      alternateLocale: 'en_US',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: metaDescription,
      images: imageUrl ? [imageUrl] : [],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: `https://afterhours.id/venue/${name.toLowerCase().replace(/\s+/g, '-')}`,
      languages: {
        id: `https://afterhours.id/venue/${name.toLowerCase().replace(/\s+/g, '-')}`,
        en: `https://afterhours.id/en/venue/${name.toLowerCase().replace(/\s+/g, '-')}`,
      },
    },
  };
}

/**
 * Generate SEO metadata for Promo pages
 */
export function generatePromoMetadata({
  title,
  description,
  venueName,
  venueCity,
  discount,
  imageUrl,
}: PromoSEOParams): Metadata {
  const location = venueCity ? `di ${cityMap[venueCity.toLowerCase()] || venueCity}` : '';
  const discountText = discount ? `Diskon ${discount}%` : 'Promo Spesial';
  
  const seoTitle = `${title} - ${discountText} ${location} | AfterHoursID`;
  const metaDescription = description.length > 160 
    ? description.substring(0, 157) + '...' 
    : description;

  const keywords: string[] = [
    title,
    venueName || '',
    'promo',
    'diskon',
    'afterhours',
    'nightlife',
    'hiburan',
  ].filter((v): v is string => v !== undefined && v !== '');

  return {
    title: seoTitle,
    description: metaDescription,
    keywords,
    openGraph: {
      title: seoTitle,
      description: metaDescription,
      type: 'article' as const,
      url: `https://afterhours.id/promo/${title.toLowerCase().replace(/\s+/g, '-')}`,
      siteName: 'AfterHoursID',
      locale: 'id_ID',
      publishedTime: new Date().toISOString(),
      tags: ['promo', 'nightlife', 'entertainment'],
      images: imageUrl ? [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: metaDescription,
      images: imageUrl ? [imageUrl] : [],
    },
    alternates: {
      canonical: `https://afterhours.id/promo/${title.toLowerCase().replace(/\s+/g, '-')}`,
    },
  };
}

/**
 * Generate SEO metadata for Event pages
 */
export function generateEventMetadata({
  name,
  description,
  venueName,
  venueCity,
  startDate,
  location,
  imageUrl,
}: EventSEOParams): Metadata {
  const dateStr = new Date(startDate).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const seoTitle = `${name} - ${dateStr} ${venueCity ? 'di ' + (cityMap[venueCity.toLowerCase()] || venueCity) : ''} | AfterHoursID`;
  const metaDescription = description.length > 160 
    ? description.substring(0, 157) + '...' 
    : description;

  const keywords: string[] = [
    name,
    venueName || '',
    'event',
    'pesta',
    'afterhours',
    'nightlife',
    dateStr,
  ].filter((v): v is string => v !== undefined && v !== '');

  return {
    title: seoTitle,
    description: metaDescription,
    keywords,
    openGraph: {
      title: seoTitle,
      description: metaDescription,
      type: 'article' as const,
      url: `https://afterhours.id/event/${name.toLowerCase().replace(/\s+/g, '-')}`,
      siteName: 'AfterHoursID',
      locale: 'id_ID',
      publishedTime: startDate,
      tags: ['event', 'nightlife', 'entertainment'],
      images: imageUrl ? [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: name,
        },
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: metaDescription,
      images: imageUrl ? [imageUrl] : [],
    },
    alternates: {
      canonical: `https://afterhours.id/event/${name.toLowerCase().replace(/\s+/g, '-')}`,
    },
  };
}

/**
 * Generate dynamic slug from venue name and city
 */
export function generateVenueSlug(name: string, city: string, category?: string): string {
  const parts = [
    city.toLowerCase(),
    category?.toLowerCase() || 'venue',
    name.toLowerCase().replace(/\s+/g, '-'),
  ].filter(Boolean);
  
  return parts.join('/');
}

/**
 * Category translation utilities
 */
export function getCategoryLabel(category: string, locale: 'id' | 'en' = 'id'): string {
  const translations: Record<string, { id: string; en: string }> = {
    club: { id: 'Club', en: 'Club' },
    bar: { id: 'Bar', en: 'Bar' },
    karaoke: { id: 'Karaoke', en: 'Karaoke' },
    KTV: { id: 'Karaoke', en: 'Karaoke' },
    spa: { id: 'Spa', en: 'Spa' },
    restaurant: { id: 'Restoran', en: 'Restaurant' },
    lounge: { id: 'Lounge', en: 'Lounge' },
    rooftop: { id: 'Rooftop', en: 'Rooftop' },
    beach_club: { id: 'Beach Club', en: 'Beach Club' },
  };
  
  return translations[category.toLowerCase()]?.[locale] || category;
}
