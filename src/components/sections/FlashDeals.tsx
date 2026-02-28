'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import Image from 'next/image';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface PromoWithVenue {
  id: string;
  title: string;
  description: string | null;
  price_value: number | null;
  start_date: string;
  end_date: string;
  venue?: {
    id: string;
    name: string;
    city: string;
    images: string[] | null;
  };
}

export default function FlashDeals() {
  const [promos, setPromos] = useState<PromoWithVenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivePromos();
  }, []);

  async function fetchActivePromos() {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('promos')
        .select(`
          *,
          venue:venues(id, name, city, images)
        `)
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .order('price_value', { ascending: true })
        .limit(6);

      if (error) {
        console.error('Error fetching promos:', error);
        setPromos([]);
      } else {
        setPromos(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setPromos([]);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function getTimeRemaining(endDate: string): string {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d left`;
    }
    
    return `${hours}h ${minutes}m left`;
  }

  if (loading) {
    return (
      <section className="py-16 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">
              <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                Flash
              </span>{' '}
              <span className="text-white">Deals</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-xl border border-gray-800 animate-pulse">
                <div className="h-40 bg-gray-800 rounded-t-xl" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-gray-800 rounded w-3/4" />
                  <div className="h-4 bg-gray-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (promos.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">
            <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
              Flash
            </span>{' '}
            <span className="text-white">Deals</span>
          </h2>
          <Link
            href="/discovery"
            className="text-yellow-500 hover:text-yellow-400 font-medium transition-colors"
          >
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promos.map((promo) => (
            <Link
              key={promo.id}
              href={promo.venue ? `/venue/${promo.venue.id}` : '#'}
              className="group bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-yellow-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/10"
            >
              {/* Image */}
              <div className="relative h-40 bg-gray-800">
                {promo.venue?.images && promo.venue.images.length > 0 ? (
                  <Image
                    src={promo.venue.images[0]}
                    alt={promo.venue.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-600 text-4xl">
                    🔥
                  </div>
                )}
                {/* Timer Badge */}
                <div className="absolute top-3 right-3 px-3 py-1 bg-red-500/90 backdrop-blur-sm rounded-full text-xs font-bold text-white flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {getTimeRemaining(promo.end_date)}
                </div>
                {/* Discount Badge */}
                {promo.price_value && (
                  <div className="absolute top-3 left-3 px-3 py-1 bg-yellow-500 backdrop-blur-sm rounded-full text-xs font-bold text-black">
                    Rp {promo.price_value.toLocaleString('id-ID')}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white group-hover:text-yellow-400 transition-colors mb-1">
                  {promo.title}
                </h3>
                {promo.venue && (
                  <p className="text-gray-400 text-sm mb-2">
                    📍 {promo.venue.name}, {promo.venue.city}
                  </p>
                )}
                {promo.description && (
                  <p className="text-gray-500 text-sm line-clamp-2">
                    {promo.description}
                  </p>
                )}
                <p className="text-gray-600 text-xs mt-3">
                  Valid until {formatDate(promo.end_date)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
