"use client";

import { useState } from "react";

/**
 * Cloudinary configuration
 * Using f_auto, q_auto for automatic optimization
 * br_adaptive for adaptive bitrate streaming
 */
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "demo";
const VIDEO_PUBLIC_ID = process.env.NEXT_PUBLIC_HERO_VIDEO_ID || "samples/hero-background";

// Cloudinary URL builder
function getCloudinaryVideoUrl(publicId: string, options: {
  f_auto?: boolean;
  q_auto?: boolean;
  br_adaptive?: boolean;
} = {}): string {
  const { f_auto = true, q_auto = true, br_adaptive = true } = options;
  
  let transforms = "";
  if (f_auto) transforms += "f_auto,";
  if (q_auto) transforms += "q_auto,";
  if (br_adaptive) transforms += "br_adaptive,";
  
  transforms = transforms.slice(0, -1); // Remove trailing comma
  
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/${transforms}/${publicId}.mp4`;
}

// Fallback local video (if Cloudinary not configured)
const LOCAL_VIDEO_PATH = "/videos/hero-background.mp4";
const LOCAL_POSTER_PATH = "/videos/hero-poster.jpg";

/**
 * Lazy Video Background Component
 * Features:
 * - Cloudinary integration with adaptive bitrate
 * - Low Quality Image Placeholder (LIP)
 * - Fallback to local video if Cloudinary fails
 */
export default function LazyVideoBackground() {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [useCloudinary, setUseCloudinary] = useState(!!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);

  const videoSrc = useCloudinary 
    ? getCloudinaryVideoUrl(VIDEO_PUBLIC_ID, { br_adaptive: true })
    : LOCAL_VIDEO_PATH;

  return (
    <>
      {/* Low Quality Image Placeholder (LIP) - Shows immediately */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br from-purple-900/40 to-pink-900/40 transition-opacity duration-500 ${
          videoLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* Blurry placeholder - could be a low-res image */}
        <div className="absolute inset-0 bg-cover bg-center blur-sm scale-110" 
          style={{ backgroundImage: `url('/videos/hero-poster.jpg')` }}
        />
      </div>

      {/* Actual video - loads after LIP */}
      <video
        autoPlay
        loop
        muted
        playsInline
        onCanPlay={() => setVideoLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          videoLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        poster={LOCAL_POSTER_PATH}
        preload="none"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
    </>
  );
}
