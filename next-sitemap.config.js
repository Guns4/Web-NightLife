/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://afterhours.id',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  
  // Source patterns
  sourceDir: './out',
  publicDir: './public',
  
  // Output
  outDir: './public',
  
  // Generate additional pages
  extraPages: {
    '/404': {
      priority: 0,
      changefreq: 'monthly',
    },
    '/500': {
      priority: 0,
      changefreq: 'monthly',
    },
  },
  
  // Exclude paths
  exclude: [
    '/api/*',
    '/admin/*',
    '/dashboard/*',
    '/auth/*',
    '/checkin/*',
    '/_next/*',
  ],
  
  // Alternate refs
  generateAlternateRefs: true,
  alternateLocale: ['id', 'en'],
  
  // Auto-fetch
  autoFetch: true,
  autoFetchLimit: 10,
  
  // Sitemap name
  sitemapName: 'sitemap',
  
  // Sort
  sort: true,
};
