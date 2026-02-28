'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Head from 'next/head';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface FormData {
  venue_name: string;
  city: string;
  category: string;
  owner_name: string;
  whatsapp_number: string;
  music_genre: string;
  dress_code: string;
  average_bottle_price: string;
  instagram_handle: string;
}

interface FormErrors {
  venue_name?: string;
  city?: string;
  category?: string;
  owner_name?: string;
  whatsapp_number?: string;
}

const CITIES = [
  'Jakarta',
  'Bali',
  'Surabaya',
  'Bandung',
  'Yogyakarta',
  'Medan',
  'Makassar',
  'Semarang',
  'Depok',
  'Tangerang',
  'Bekasi',
  ' Lainnya'
];

const CATEGORIES = [
  { value: 'club', label: 'Club' },
  { value: 'lounge', label: 'Lounge' },
  { value: 'speakeasy', label: 'Speakeasy' },
  { value: 'bar', label: 'Bar' },
  { value: 'rooftop', label: 'Rooftop' },
  { value: 'beach_club', label: 'Beach Club' },
  { value: 'karaoke', label: 'Karaoke' },
  { value: 'ktv', label: 'KTV' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'spa', label: 'Spa' },
];

const MUSIC_GENRES = [
  'Hip Hop / R&B',
  'EDM / Electronic',
  'House / Techno',
  'Pop / Top 40',
  'Live Band',
  'Jazz / Soul',
  'Rock / Alternative',
  'Mixed / Open Format',
  'Latin',
  'Reggae / Dancehall',
];

const DRESS_CODES = [
  'Smart Casual',
  'Business Formal',
  'Dress to Impress',
  'Casual',
  'Beach / Resort',
  'Themed',
];

const PRICE_RANGES = [
  { value: '500000', label: 'Rp 500.000 - 1.000.000' },
  { value: '1500000', label: 'Rp 1.000.000 - 2.000.000' },
  { value: '2500000', label: 'Rp 2.000.000 - 3.000.000' },
  { value: '4000000', label: 'Rp 3.000.000 - 5.000.000' },
  { value: '5000000', label: 'Rp 5.000.000+' },
];

export default function PartnersPage() {
  const [formData, setFormData] = useState<FormData>({
    venue_name: '',
    city: '',
    category: '',
    owner_name: '',
    whatsapp_number: '',
    music_genre: '',
    dress_code: '',
    average_bottle_price: '',
    instagram_handle: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.venue_name.trim()) {
      newErrors.venue_name = 'Venue name is required';
    }
    if (!formData.city) {
      newErrors.city = 'Please select a city';
    }
    if (!formData.category) {
      newErrors.category = 'Please select a venue category';
    }
    if (!formData.owner_name.trim()) {
      newErrors.owner_name = 'Owner/Manager name is required';
    }
    if (!formData.whatsapp_number.trim()) {
      newErrors.whatsapp_number = 'WhatsApp number is required';
    } else if (!/^\+?[\d\s-]{10,}$/.test(formData.whatsapp_number.replace(/\s/g, ''))) {
      newErrors.whatsapp_number = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('partner_applications')
        .insert({
          venue_name: formData.venue_name,
          city: formData.city,
          category: formData.category,
          owner_name: formData.owner_name,
          whatsapp_number: formData.whatsapp_number,
          music_genre: formData.music_genre || null,
          dress_code: formData.dress_code || null,
          average_bottle_price: formData.average_bottle_price ? parseFloat(formData.average_bottle_price) : null,
          instagram_handle: formData.instagram_handle || null,
          status: 'pending',
        });

      if (error) {
        console.error('Error submitting application:', error);
        setSubmitError('Failed to submit application. Please try again.');
      } else {
        setIsSuccess(true);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  if (isSuccess) {
    return (
      <>
        <Head>
          <title>Partnership | AfterHoursID - Grow Your Nightlife Venue</title>
          <meta name="description" content="Apply for partnership with AfterHoursID and connect with high-spending guests." />
        </Head>
        <div className="min-h-screen bg-black flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">
                VVIP <span className="text-yellow-400">Thank You</span>
              </h2>
              <p className="text-gray-400 text-lg">
                Aplikasi Anda telah diterima. Concierge kami akan menghubungi Anda dalam 24 jam untuk proses verifikasi.
              </p>
            </div>
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-gray-900 border border-yellow-500/30 text-yellow-400 rounded-lg hover:bg-yellow-500/10 transition-all"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Partnership | AfterHoursID - Grow Your Nightlife Venue</title>
        <meta name="description" content="Bergabunglah dengan ekosistem AfterHoursID dan hubungkan venue Anda dengan komunitas high-spender terkurasi." />
      </Head>

      <div className="min-h-screen bg-black text-white">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          {/* Gold radial glow background */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center_top,_rgba(197,160,111,0.15)_0%,_transparent_70%)]" />
          
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
                Elevate Your Venue's <span className="text-yellow-400">Legacy</span>.
              </h1>
              <p className="text-xl text-gray-400 mb-8">
                Bergabunglah dengan ekosistem AfterHoursID dan hubungkan venue Anda dengan komunitas high-spender terkurasi.
              </p>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Venue Identity */}
            <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-6 space-y-6">
              <h3 className="text-lg font-semibold text-yellow-400 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Venue Identity
              </h3>

              <div>
                <label htmlFor="venue_name" className="block text-sm font-medium text-gray-300 mb-2">
                  Nama Venue <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="venue_name"
                  name="venue_name"
                  value={formData.venue_name}
                  onChange={handleChange}
                  placeholder="Contoh: Club Kuta Bali"
                  className={`w-full px-4 py-3 bg-black/40 border ${errors.venue_name ? 'border-red-500' : 'border-white/10'} rounded-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all placeholder:text-gray-600`}
                />
                {errors.venue_name && <p className="mt-1 text-sm text-red-400">{errors.venue_name}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-2">
                    Lokasi (Kota) <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-black/40 border ${errors.city ? 'border-red-500' : 'border-white/10'} rounded-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all appearance-none`}
                  >
                    <option value="">Pilih Kota</option>
                    {CITIES.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  {errors.city && <p className="mt-1 text-sm text-red-400">{errors.city}</p>}
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                    Kategori <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-black/40 border ${errors.category ? 'border-red-500' : 'border-white/10'} rounded-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all appearance-none`}
                  >
                    <option value="">Pilih Kategori</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                  {errors.category && <p className="mt-1 text-sm text-red-400">{errors.category}</p>}
                </div>
              </div>
            </div>

            {/* Contact Persona */}
            <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-6 space-y-6">
              <h3 className="text-lg font-semibold text-yellow-400 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Contact Persona
              </h3>

              <div>
                <label htmlFor="owner_name" className="block text-sm font-medium text-gray-300 mb-2">
                  Nama Owner/Manager <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="owner_name"
                  name="owner_name"
                  value={formData.owner_name}
                  onChange={handleChange}
                  placeholder="Nama lengkap Anda"
                  className={`w-full px-4 py-3 bg-black/40 border ${errors.owner_name ? 'border-red-500' : 'border-white/10'} rounded-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all placeholder:text-gray-600`}
                />
                {errors.owner_name && <p className="mt-1 text-sm text-red-400">{errors.owner_name}</p>}
              </div>

              <div>
                <label htmlFor="whatsapp_number" className="block text-sm font-medium text-gray-300 mb-2">
                  Nomor WhatsApp <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  id="whatsapp_number"
                  name="whatsapp_number"
                  inputMode="tel"
                  value={formData.whatsapp_number}
                  onChange={handleChange}
                  placeholder="+62812345678"
                  className={`w-full px-4 py-3 bg-black/40 border ${errors.whatsapp_number ? 'border-red-500' : 'border-white/10'} rounded-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all placeholder:text-gray-600`}
                />
                {errors.whatsapp_number && <p className="mt-1 text-sm text-red-400">{errors.whatsapp_number}</p>}
              </div>
            </div>

            {/* Vibe Profile */}
            <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-6 space-y-6">
              <h3 className="text-lg font-semibold text-yellow-400 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                Vibe Profile
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="music_genre" className="block text-sm font-medium text-gray-300 mb-2">
                    Music Genre
                  </label>
                  <select
                    id="music_genre"
                    name="music_genre"
                    value={formData.music_genre}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all appearance-none"
                  >
                    <option value="">Pilih Genre</option>
                    {MUSIC_GENRES.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="dress_code" className="block text-sm font-medium text-gray-300 mb-2">
                    Dress Code
                  </label>
                  <select
                    id="dress_code"
                    name="dress_code"
                    value={formData.dress_code}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all appearance-none"
                  >
                    <option value="">Pilih Dress Code</option>
                    {DRESS_CODES.map(code => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="average_bottle_price" className="block text-sm font-medium text-gray-300 mb-2">
                  Average Bottle Price (untuk AI matching)
                </label>
                <select
                  id="average_bottle_price"
                  name="average_bottle_price"
                  value={formData.average_bottle_price}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all appearance-none"
                >
                  <option value="">Pilih Range Harga</option>
                  {PRICE_RANGES.map(price => (
                    <option key={price.value} value={price.value}>{price.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Socials */}
            <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-6 space-y-6">
              <h3 className="text-lg font-semibold text-yellow-400 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.173V16m0-10l-3 3m6-3l3 3m6-3l3-3m-5.657-5.657l-1.414-1.414M17.657 18.657l1.414-1.414M3 12h18M3 6h18" />
                </svg>
                Socials
              </h3>

              <div>
                <label htmlFor="instagram_handle" className="block text-sm font-medium text-gray-300 mb-2">
                  Instagram Handle (untuk verifikasi)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                  <input
                    type="text"
                    id="instagram_handle"
                    name="instagram_handle"
                    value={formData.instagram_handle}
                    onChange={handleChange}
                    placeholder="venueaccount"
                    className="w-full pl-8 pr-4 py-3 bg-black/40 border border-white/10 rounded-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all placeholder:text-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
                {submitError}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              <div className="relative px-8 py-4 bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-lg font-semibold text-lg text-black shadow-lg shadow-yellow-500/20">
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Mengirim Aplikasi...
                  </span>
                ) : (
                  'Apply for Partnership'
                )}
              </div>
              {/* Shine effect */}
              <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
            </button>
          </form>

          {/* Trust Signals */}
          <div className="mt-16 pt-8 border-t border-white/10">
            <h3 className="text-center text-lg font-semibold text-gray-400 mb-8">
              Why Partner with Us?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-14 h-14 bg-yellow-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-white mb-2">High-Value Guests</h4>
                <p className="text-sm text-gray-500">Connect with curated high-spending members</p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 bg-yellow-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-white mb-2">AI Discovery</h4>
                <p className="text-sm text-gray-500">Smart matching with AI-powered recommendations</p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 bg-yellow-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-white mb-2">Data Insights</h4>
                <p className="text-sm text-gray-500">Real-time analytics and performance tracking</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shine {
          100% {
            left: 125%;
          }
        }
        .group-hover\\:animate-shine {
          animation: shine 1s;
        }
      `}</style>
    </>
  );
}
