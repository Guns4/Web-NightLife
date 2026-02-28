import Navbar from "@/components/sections/Navbar";
import Hero from "@/components/sections/Hero";
import Footer from "@/components/sections/Footer";
import FlashDeals from "@/components/sections/FlashDeals";

/**
 * Main Home Page
 * NightLife Platform - Premium Nightlife Discovery
 * 
 * Features:
 * - Sticky transparent navbar with glassmorphism
 * - Hero section with video background and search
 * - Flash Deals section showing active promotions
 * - Category selection with animations
 * - Professional footer with dark aesthetic
 */
export default function Home() {
  return (
    <main className="min-h-screen bg-deep-black">
      <Navbar />
      <Hero />
      <FlashDeals />
      <Footer />
    </main>
  );
}
