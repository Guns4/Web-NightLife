"use client";

import Link from "next/link";

/**
 * AfterHoursID Logo Component
 * Executive Noir Style - Luxurious, Mysterious, Professional
 * 
 * Features:
 * - Gold gradient text for "AFTERHOURS"
 * - White text for "ID"
 * - Clickable link to home
 */
interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export default function Logo({ className = "", width = 250, height = 50 }: LogoProps) {
  return (
    <Link href="/" className={className} aria-label="AfterHoursID - Home">
      <svg
        width={width}
        height={height}
        viewBox="0 0 250 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform hover:scale-105 duration-300"
      >
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: "#D4AF37", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "#F9E4B7", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "#C5A06F", stopOpacity: 1 }} />
          </linearGradient>
          <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <text
          x="0"
          y="35"
          fontFamily="'Inter', sans-serif"
          fontWeight={800}
          fontSize="26"
          letterSpacing="0.05em"
          fill="url(#goldGradient)"
          style={{ textTransform: "uppercase" }}
          filter="url(#goldGlow)"
        >
          AFTERHOURS
          <tspan fill="#FFFFFF" fontWeight={300}>
            ID
          </tspan>
        </text>
      </svg>
    </Link>
  );
}
