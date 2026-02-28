'use client';

import Image, { ImageProps } from 'next/image';
import { useRouter } from 'next/navigation';

interface SEOImageProps extends Omit<ImageProps, 'alt'> {
  venueName?: string;
  city?: string;
  alt?: string;
}

/**
 * SEO-optimized Image component with automatic alt text generation
 */
export function SEOImage({
  src,
  venueName,
  city,
  alt,
  priority = false,
  ...props
}: SEOImageProps) {
  // Generate alt text if not provided
  const generatedAlt = alt || (venueName && city 
    ? `${venueName} - ${city} - AfterHoursID`
    : venueName 
      ? `${venueName} - AfterHoursID`
      : 'AfterHoursID - Platform Hiburan Malam Indonesia');

  return (
    <Image
      src={src}
      alt={generatedAlt}
      priority={priority}
      {...props}
    />
  );
}

/**
 * Hero Image component with LCP optimization
 */
export function HeroImage({
  src,
  venueName,
  city,
  ...props
}: Omit<SEOImageProps, 'priority'> & { priority?: boolean }) {
  return (
    <SEOImage
      src={src}
      venueName={venueName}
      city={city}
      priority={true}
      sizes="100vw"
      fill
      style={{ objectFit: 'cover' }}
      {...props}
    />
  );
}

/**
 * Thumbnail Image component
 */
export function ThumbnailImage({
  src,
  venueName,
  city,
  ...props
}: Omit<SEOImageProps, 'priority'>) {
  return (
    <SEOImage
      src={src}
      venueName={venueName}
      city={city}
      priority={false}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      {...props}
    />
  );
}

/**
 * Preload Hero Image component for LCP optimization
 */
export function PreloadHeroImage({ src }: { src: string }) {
  return (
    <link
      rel="preload"
      as="image"
      href={src}
    />
  );
}

/**
 * Image with lazy loading and blur placeholder
 */
export function LazyImage({
  src,
  venueName,
  city,
  ...props
}: Omit<SEOImageProps, 'priority'>) {
  return (
    <Image
      src={src}
      alt={venueName && city 
        ? `${venueName} - ${city} - AfterHoursID`
        : venueName 
          ? `${venueName} - AfterHoursID`
          : 'AfterHoursID - Platform Hiburan Malam Indonesia'}
      loading="lazy"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAgEDBAMBAAAAAAAAAAAAAQIDAAQRBQYSIRMxQWH/xAAVAQEBAAAAAAAAAAAAAAAAAAADBP/EABsRAAICAwEAAAAAAAAAAAAAAAECAAMEESEx/9oADAMBAAIRAxEAPwCLpWn22m20VvaxLFDEoVFA4AH9/Oc6c0nX9V0q5W402+uLWYciaGVoyfzggjR8M65Tq/VdW6a1yPR76xsp7iW3W4LQTuFCFiuMlRzxz+60P/wAl6j/9abT/APJcf/OnK0eS6RJJJyeT/ddP0j1dqWh6tZaxYzr9fZyLLGXGVJHiCD4I8H9ca0+lep9P6l0q31XT5N9JOCGU+VPmR+D/ABrL6T9M0k8+U+U+VO1q8qXH0v2v8A/9k="
      {...props}
    />
  );
}

export default SEOImage;
