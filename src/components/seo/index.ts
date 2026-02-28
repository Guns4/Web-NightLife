// SEO Components
export { LocalBusinessSchema, EventSchema, BreadcrumbSchema, FAQSchema, OrganizationSchema, WebsiteSchema, generateVenueSchema, generateEventSchema } from './JsonLd';
export { SEOImage, HeroImage, ThumbnailImage, LazyImage, PreloadHeroImage } from './SEOImage';
export { GoogleTagManager, GoogleTagManagerNoScript, GA4PageView, MetaPixel, TrackingProvider, trackEvent, ConversionEvents, trackWhatsAppClick, trackPromoClaim, trackVenueView, trackSignUp, trackReviewSubmit } from './Tracking';

// SEO Utilities
export { generateVenueMetadata, generatePromoMetadata, generateEventMetadata, generateVenueSlug, getCategoryLabel } from '@/lib/seo/metadata';
