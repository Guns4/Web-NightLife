/**
 * =====================================================
 * MULTI-CITY & SEO SERVICE
 * AfterHoursID - AI Concierge & Global Scale
 * =====================================================
 */

import { v4 as uuidv4 } from 'uuid';

// =====================================================
// CITY CONFIGURATION
// =====================================================

export interface CityConfig {
  slug: string;
  name: string;
  region: string;
  timezone: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  featuredVenues: string[];
  trendingCategories: string[];
}

export const CITIES: Record<string, CityConfig> = {
  jakarta: {
    slug: 'jakarta',
    name: 'Jakarta',
    region: 'DKI Jakarta',
    timezone: 'Asia/Jakarta',
    coordinates: { lat: -6.2088, lng: 106.8456 },
    featuredVenues: [],
    trendingCategories: ['club', 'lounge', 'rooftop'],
  },
  bali: {
    slug: 'bali',
    name: 'Bali',
    region: 'Bali',
    timezone: 'Asia/Makassar',
    coordinates: { lat: -8.3405, lng: 115.0920 },
    featuredVenues: [],
    trendingCategories: ['beach-club', 'bar', 'restaurant'],
  },
  surabaya: {
    slug: 'surabaya',
    name: 'Surabaya',
    region: 'East Java',
    timezone: 'Asia/Jakarta',
    coordinates: { lat: -7.2575, lng: 112.7521 },
    featuredVenues: [],
    trendingCategories: ['karaoke', 'pub', 'lounge'],
  },
  bandung: {
    slug: 'bandung',
    name: 'Bandung',
    region: 'West Java',
    timezone: 'Asia/Jakarta',
    coordinates: { lat: -6.9175, lng: 107.6191 },
    featuredVenues: [],
    trendingCategories: ['cafe', 'live-music', 'bar'],
  },
  yogyakarta: {
    slug: 'yogyakarta',
    name: 'Yogyakarta',
    region: 'DIY Yogyakarta',
    timezone: 'Asia/Jakarta',
    coordinates: { lat: -7.7956, lng: 110.3695 },
    featuredVenues: [],
    trendingCategories: ['bar', 'live-music', 'cafe'],
  },
};

// =====================================================
// SEO PAGE GENERATION
// =====================================================

export interface SEOPage {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  city: string;
  type: 'category' | 'trending' | 'event' | 'guide';
  venues: string[];
  content?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// In-memory store
const seoPages: Map<string, SEOPage> = new Map();

/**
 * Generate auto-marketing SEO pages
 */
export async function generateSEOPages(city: string): Promise<SEOPage[]> {
  const cityConfig = CITIES[city];
  if (!cityConfig) return [];
  
  const pages: SEOPage[] = [];
  const now = new Date().toISOString();
  
  // 1. City Landing Page
  const cityPage: SEOPage = {
    id: uuidv4(),
    title: `Best Nightlife in ${cityConfig.name} - AfterHoursID`,
    description: `Discover the best bars, clubs, and lounges in ${cityConfig.name}. Browse reviews, make reservations, and find exclusive promotions.`,
    keywords: [
      `nightlife ${cityConfig.name}`,
      `best bars ${cityConfig.name}`,
      `clubs ${cityConfig.name}`,
      `entertainment ${cityConfig.name}`,
    ],
    city,
    type: 'category',
    venues: cityConfig.featuredVenues,
    published: true,
    createdAt: now,
    updatedAt: now,
  };
  pages.push(cityPage);
  
  // 2. Category Pages
  for (const category of cityConfig.trendingCategories) {
    const categoryPage: SEOPage = {
      id: uuidv4(),
      title: `Best ${category.charAt(0).toUpperCase() + category.slice(1)} in ${cityConfig.name} - AfterHoursID`,
      description: `Find the top-rated ${category} venues in ${cityConfig.name}. Read reviews, view photos, and book your table now.`,
      keywords: [
        `${category} ${cityConfig.name}`,
        `best ${category}`,
        `${cityConfig.name} ${category}`,
      ],
      city,
      type: 'category',
      venues: [],
      published: true,
      createdAt: now,
      updatedAt: now,
    };
    pages.push(categoryPage);
  }
  
  // 3. Trending "Tonight" Page
  const trendingPage: SEOPage = {
    id: uuidv4(),
    title: `Trending Tonight in ${cityConfig.name} - Hot Places Now`,
    description: `See what's happening tonight in ${cityConfig.name}. Real-time trending venues, live availability, and exclusive door deals.`,
    keywords: [
      `tonight ${cityConfig.name}`,
      `trending now ${cityConfig.name}`,
      `happening now ${cityConfig.name}`,
      `${cityConfig.name} tonight`,
    ],
    city,
    type: 'trending',
    venues: [],
    published: true,
    createdAt: now,
    updatedAt: now,
  };
  pages.push(trendingPage);
  
  // 4. Top 10 List
  const top10Page: SEOPage = {
    id: uuidv4(),
    title: `Top 10 Bars & Clubs in ${cityConfig.name} - Ultimate Guide`,
    description: `The definitive ranking of the best nightlife spots in ${cityConfig.name}. From rooftop bars to underground clubs, find your perfect night out.`,
    keywords: [
      `top 10 ${cityConfig.name}`,
      `best venues ${cityConfig.name}`,
      `${cityConfig.name} guide`,
    ],
    city,
    type: 'guide',
    venues: cityConfig.featuredVenues,
    content: generateTop10Content(cityConfig),
    published: true,
    createdAt: now,
    updatedAt: now,
  };
  pages.push(top10Page);
  
  // Store pages
  pages.forEach(p => seoPages.set(p.id, p));
  
  return pages;
}

/**
 * Generate content for top 10 page
 */
function generateTop10Content(cityConfig: CityConfig): string {
  return `
# Top 10 Nightlife Spots in ${cityConfig.name}

Discover the best of ${cityConfig.name}'s vibrant nightlife scene!

## Methodology
Our rankings are based on:
- AfterHours Score (weighted reviews)
- Real-time booking data
- User ratings and reviews
- Popularity trends

## Honorable Mentions
[Additional venues...]

## How to Book
1. Browse venues on AfterHoursID
2. Check real-time availability
3. Book your table instantly
4. Get exclusive deals

Book now at afterhours.id/${cityConfig.slug}!
  `.trim();
}

/**
 * Get SEO page by slug
 */
export async function getSEOPage(slug: string): Promise<SEOPage | null> {
  return Array.from(seoPages.values()).find(p => 
    p.title.toLowerCase().replace(/\s+/g, '-').includes(slug)
  ) || null;
}

/**
 * Get all pages for a city
 */
export async function getCityPages(city: string): Promise<SEOPage[]> {
  return Array.from(seoPages.values()).filter(p => p.city === city);
}

/**
 * Auto-generate pages from trending data
 */
export async function autoGenerateFromTrending(): Promise<void> {
  // This would analyze trending data and generate new pages
  console.log('Auto-generating SEO pages from trending data...');
  
  for (const city of Object.keys(CITIES)) {
    await generateSEOPages(city);
  }
  
  console.log('SEO page generation complete');
}

// =====================================================
// DYNAMIC META TAGS
// =====================================================

export interface MetaTags {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  canonical?: string;
}

/**
 * Generate meta tags for a page
 */
export function generateMetaTags(page: SEOPage): MetaTags {
  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    canonical: `https://afterhours.id/${page.city}/${page.type}`,
  };
}
