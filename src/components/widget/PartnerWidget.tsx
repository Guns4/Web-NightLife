/**
 * =====================================================
 * WHITE-LABEL PARTNER WIDGET
 * AfterHoursID - AI Concierge & Global Scale
 * =====================================================
 */

'use client';

import { useState, useEffect } from 'react';

interface PartnerWidgetProps {
  partnerId: string;
  theme?: 'light' | 'dark';
  position?: 'bottom-right' | 'bottom-left';
  venueId?: string;
}

interface Venue {
  id: string;
  name: string;
  rating: number;
  images: string[];
  priceRange: string;
}

interface Booking {
  venueId: string;
  date: string;
  time: string;
  guests: number;
  name: string;
  phone: string;
}

export default function PartnerWidget({ 
  partnerId, 
  theme = 'dark',
  position = 'bottom-right',
  venueId 
}: PartnerWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'search' | 'details' | 'booking' | 'confirmation'>('search');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [booking, setBooking] = useState<Partial<Booking>>({});
  const [loading, setLoading] = useState(false);
  
  // Search venues
  const handleSearch = async () => {
    setLoading(true);
    try {
      // In production, call API
      const response = await fetch(`/api/v1/venues?search=${searchQuery}&limit=5`);
      const data = await response.json();
      setVenues(data.venues || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle venue selection
  const handleVenueSelect = (venue: Venue) => {
    setSelectedVenue(venue);
    setStep('details');
  };
  
  // Handle booking submit
  const handleBooking = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/booking/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...booking,
          venueId: selectedVenue?.id,
          partnerId,
        }),
      });
      
      if (response.ok) {
        setStep('confirmation');
      }
    } catch (error) {
      console.error('Booking error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const themeStyles = theme === 'dark' ? {
    container: 'bg-slate-900 border-slate-700',
    text: 'text-white',
    textMuted: 'text-slate-400',
    input: 'bg-slate-800 border-slate-700 text-white',
    button: 'bg-cyan-500 hover:bg-cyan-400',
    venueCard: 'bg-slate-800 border-slate-700',
  } : {
    container: 'bg-white border-gray-200',
    text: 'text-gray-900',
    textMuted: 'text-gray-500',
    input: 'bg-gray-50 border-gray-300 text-gray-900',
    button: 'bg-black hover:bg-gray-800',
    venueCard: 'bg-gray-50 border-gray-200',
  };
  
  const positionStyles = position === 'bottom-right' 
    ? 'bottom-6 right-6' 
    : 'bottom-6 left-6';
  
  return (
    <div className={`fixed ${positionStyles} z-50`}>
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`${themeStyles.button} ${themeStyles.text} px-6 py-3 rounded-full font-semibold shadow-lg flex items-center gap-2`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Book Now
        </button>
      )}
      
      {/* Widget Panel */}
      {isOpen && (
        <div className={`w-96 ${themeStyles.container} border rounded-2xl shadow-2xl overflow-hidden`}>
          {/* Header */}
          <div className={`px-6 py-4 border-b ${themeStyles.textMuted} flex items-center justify-between`}>
            <h3 className={`font-bold ${themeStyles.text}`}>Reserve a Table</h3>
            <button onClick={() => setIsOpen(false)} className="text-sm">
              ✕
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {step === 'search' && (
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm mb-2 ${themeStyles.textMuted}`}>
                    Search Venue
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for a venue..."
                    className={`w-full px-4 py-3 rounded-xl border ${themeStyles.input}`}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className={`w-full py-3 rounded-xl ${themeStyles.button} ${themeStyles.text} font-semibold`}
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
                
                {/* Results */}
                {venues.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {venues.map((venue) => (
                      <button
                        key={venue.id}
                        onClick={() => handleVenueSelect(venue)}
                        className={`w-full p-3 rounded-xl border ${themeStyles.venueCard} flex items-center gap-3 text-left`}
                      >
                        <div className="w-12 h-12 rounded-lg bg-slate-700" />
                        <div className="flex-1">
                          <div className={`font-medium ${themeStyles.text}`}>{venue.name}</div>
                          <div className={`text-sm ${themeStyles.textMuted}`}>
                            ⭐ {venue.rating} • {venue.priceRange}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {step === 'details' && selectedVenue && (
              <div className="space-y-4">
                <div className="text-center">
                  <h4 className={`font-bold text-lg ${themeStyles.text}`}>{selectedVenue.name}</h4>
                  <p className={`text-sm ${themeStyles.textMuted}`}>⭐ {selectedVenue.rating}</p>
                </div>
                
                <div>
                  <label className={`block text-sm mb-2 ${themeStyles.textMuted}`}>Date</label>
                  <input
                    type="date"
                    value={booking.date || ''}
                    onChange={(e) => setBooking({ ...booking, date: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border ${themeStyles.input}`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm mb-2 ${themeStyles.textMuted}`}>Time</label>
                  <input
                    type="time"
                    value={booking.time || ''}
                    onChange={(e) => setBooking({ ...booking, time: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border ${themeStyles.input}`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm mb-2 ${themeStyles.textMuted}`}>Guests</label>
                  <select
                    value={booking.guests || 2}
                    onChange={(e) => setBooking({ ...booking, guests: parseInt(e.target.value) })}
                    className={`w-full px-4 py-3 rounded-xl border ${themeStyles.input}`}
                  >
                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                      <option key={n} value={n}>{n} guest{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setStep('search')}
                    className={`flex-1 py-3 rounded-xl border ${themeStyles.textMuted}`}
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep('booking')}
                    className={`flex-1 py-3 rounded-xl ${themeStyles.button} ${themeStyles.text} font-semibold`}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}
            
            {step === 'booking' && (
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm mb-2 ${themeStyles.textMuted}`}>Your Name</label>
                  <input
                    type="text"
                    value={booking.name || ''}
                    onChange={(e) => setBooking({ ...booking, name: e.target.value })}
                    placeholder="Enter your name"
                    className={`w-full px-4 py-3 rounded-xl border ${themeStyles.input}`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm mb-2 ${themeStyles.textMuted}`}>Phone Number</label>
                  <input
                    type="tel"
                    value={booking.phone || ''}
                    onChange={(e) => setBooking({ ...booking, phone: e.target.value })}
                    placeholder="+62xxx"
                    className={`w-full px-4 py-3 rounded-xl border ${themeStyles.input}`}
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setStep('details')}
                    className={`flex-1 py-3 rounded-xl border ${themeStyles.textMuted}`}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleBooking}
                    disabled={loading || !booking.name || !booking.phone}
                    className={`flex-1 py-3 rounded-xl ${themeStyles.button} ${themeStyles.text} font-semibold disabled:opacity-50`}
                  >
                    {loading ? 'Booking...' : 'Confirm Booking'}
                  </button>
                </div>
              </div>
            )}
            
            {step === 'confirmation' && (
              <div className="text-center py-6">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-emerald-500/20' : 'bg-green-100'}`}>
                  <svg className={`w-8 h-8 ${theme === 'dark' ? 'text-emerald-400' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className={`font-bold text-lg mb-2 ${themeStyles.text}`}>Booking Confirmed!</h4>
                <p className={`text-sm ${themeStyles.textMuted}`}>
                  We'll send you a confirmation via WhatsApp
                </p>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setStep('search');
                    setBooking({});
                  }}
                  className={`mt-4 px-6 py-2 rounded-xl ${themeStyles.button} ${themeStyles.text}`}
                >
                  Done
                </button>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className={`px-6 py-3 border-t text-center ${themeStyles.textMuted} text-xs`}>
            Powered by <span className="font-semibold text-cyan-400">AfterHoursID</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Embed code generator for partners
 */
export function generateEmbedCode(partnerId: string, venueId?: string): string {
  return `<script src="https://afterhours.id/widget.js" data-partner="${partnerId}"${venueId ? ` data-venue="${venueId}"` : ''}></script>`;
}
