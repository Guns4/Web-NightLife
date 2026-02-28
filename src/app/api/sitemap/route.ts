import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'always' | 'hourly' | 'never';
  priority: number;
}

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = 'https://afterhours.id';
  const urls: SitemapUrl[] = [];

  // Static pages
  const staticPages = [
    { loc: '/', changefreq: 'daily' as const, priority: 1.0 },
    { loc: '/discovery', changefreq: 'daily' as const, priority: 0.9 },
    { loc: '/events', changefreq: 'daily' as const, priority: 0.9 },
    { loc: '/guides', changefreq: 'weekly' as const, priority: 0.7 },
    { loc: '/safety', changefreq: 'monthly' as const, priority: 0.5 },
    { loc: '/partners', changefreq: 'monthly' as const, priority: 0.6 },
    { loc: '/brand-portal', changefreq: 'monthly' as const, priority: 0.5 },
    { loc: '/corporate', changefreq: 'monthly' as const, priority: 0.5 },
    { loc: '/government', changefreq: 'monthly' as const, priority: 0.4 },
    { loc: '/auth/signin', changefreq: 'monthly' as const, priority: 0.3 },
  ];

  staticPages.forEach((page) => {
    urls.push({
      loc: `${baseUrl}${page.loc}`,
      lastmod: new Date().toISOString(),
      changefreq: page.changefreq,
      priority: page.priority,
    });
  });

  // Dynamic venue pages
  try {
    const venues = await prisma.venue.findMany({
      where: { is_active: true },
      select: {
        id: true,
        name: true,
        city: true,
        category: true,
        updated_at: true,
      },
      take: 1000, // Limit for performance
    });

    const venueData: Array<{
      id: string;
      name: string;
      city: string;
      category: string;
      updated_at: Date | null;
    }> = venues;

    venueData.forEach((venue) => {
      const slug = venue.name.toLowerCase().replace(/\s+/g, '-');
      urls.push({
        loc: `${baseUrl}/venue/${venue.id}/${slug}`,
        lastmod: venue.updated_at?.toISOString() || new Date().toISOString(),
        changefreq: 'weekly',
        priority: 0.8,
      });
    });
  } catch (error) {
    console.error('Error fetching venues for sitemap:', error);
  }

  // Generate sitemap XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls
    .map(
      (url) => `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
    )
    .join('')}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
