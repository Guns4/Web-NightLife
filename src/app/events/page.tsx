'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Event {
  id: string;
  event_name: string;
  event_type: string;
  start_date: string;
  end_date: string;
  location_name: string;
  latitude: number;
  longitude: number;
  is_outdoor: boolean;
  total_tickets: number;
  sold_tickets: number;
  ticket_price: number;
  has_interactive_map: boolean;
  has_friend_tracking: boolean;
  status: string;
  venue?: { name: string; category: string };
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [userTickets, setUserTickets] = useState<any[]>([]);

  useEffect(() => {
    loadEvents();
    loadUserTickets();
  }, []);

  useEffect(() => {
    if (selectedType === 'all') {
      setFilteredEvents(events);
    } else {
      setFilteredEvents(events.filter(e => e.event_type === selectedType));
    }
  }, [selectedType, events]);

  async function loadEvents() {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('major_events')
      .select('*, venue:venues(name, category)')
      .eq('status', 'published')
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true });
    
    setEvents(data || []);
    setFilteredEvents(data || []);
    setLoading(false);
  }

  async function loadUserTickets() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data } = await supabase
      .from('event_tickets')
      .select('*, event:event_id(event_name, start_date)')
      .eq('user_id', user.id);
    
    setUserTickets(data || []);
  }

  async function purchaseTicket(eventId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please sign in to purchase tickets');
      return;
    }
    
    const ticketNumber = `TKT${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const qrCode = `QR${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    const { error } = await supabase
      .from('event_tickets')
      .insert({
        event_id: eventId,
        user_id: user.id,
        ticket_number: ticketNumber,
        qr_code: qrCode
      });
    
    if (!error) {
      // Update sold count
      const event = events.find(e => e.id === eventId);
      if (event) {
        await supabase
          .from('major_events')
          .update({ sold_tickets: event.sold_tickets + 1 })
          .eq('id', eventId);
      }
      
      alert('Ticket purchased successfully!');
      loadEvents();
      loadUserTickets();
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  const eventTypes = ['all', 'festival', 'concert', 'party', 'popup'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Hero */}
      <div className="relative h-64 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 to-pink-900/80"></div>
        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-20"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-5xl font-bold mb-2">🎉 Events & Festivals</h1>
          <p className="text-xl text-purple-200">Discover the hottest nightlife events in Indonesia</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Filter */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {eventTypes.map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedType === type
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* My Tickets */}
        {userTickets.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">My Tickets</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {userTickets.map(ticket => (
                <div key={ticket.id} className="bg-purple-600/30 border border-purple-500 rounded-xl p-4 min-w-[250px]">
                  <div className="font-semibold">{ticket.event?.event_name}</div>
                  <div className="text-sm text-purple-300">{formatDate(ticket.event?.start_date)}</div>
                  <div className="mt-2 text-xs font-mono bg-purple-900/50 px-2 py-1 rounded">
                    {ticket.ticket_number}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Events Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(event => (
              <div
                key={event.id}
                className="bg-gray-800/40 rounded-2xl overflow-hidden border border-gray-700 hover:border-purple-500/50 transition-all group"
              >
                {/* Image placeholder */}
                <div className="h-40 bg-gradient-to-br from-purple-600/30 to-pink-600/30 relative">
                  <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-50">
                    {event.event_type === 'festival' ? '🎪' : event.event_type === 'concert' ? '🎤' : '🎉'}
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      event.is_outdoor ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {event.is_outdoor ? 'Outdoor' : 'Indoor'}
                    </span>
                  </div>
                </div>
                
                <div className="p-5">
                  <div className="text-xs text-purple-400 uppercase tracking-wider mb-1">
                    {event.event_type}
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-purple-400 transition-colors">
                    {event.event_name}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-gray-400 mb-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(event.start_date)}
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {event.location_name || event.venue?.name || 'TBA'}
                    </div>
                  </div>
                  
                  {/* Features */}
                  <div className="flex gap-2 mb-4">
                    {event.has_interactive_map && (
                      <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                        🗺️ Map
                      </span>
                    )}
                    {event.has_friend_tracking && (
                      <span className="text-xs bg-pink-500/20 text-pink-300 px-2 py-1 rounded-full">
                        👥 Friends
                      </span>
                    )}
                  </div>
                  
                  {/* Price & Availability */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                    <div>
                      <div className="text-xs text-gray-400">Price</div>
                      <div className="text-xl font-bold text-green-400">
                        Rp {event.ticket_price?.toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">Available</div>
                      <div className="font-medium">
                        {event.total_tickets - event.sold_tickets} / {event.total_tickets}
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress */}
                  <div className="mt-3 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${(event.sold_tickets / event.total_tickets) * 100}%` }}
                    />
                  </div>
                  
                  {/* Action */}
                  <button
                    onClick={() => setSelectedEvent(event)}
                    className="w-full mt-4 bg-purple-600 hover:bg-purple-700 py-3 rounded-xl font-medium transition-colors"
                  >
                    {event.sold_tickets >= event.total_tickets ? 'Sold Out' : 'Get Tickets'}
                  </button>
                </div>
              </div>
            ))}
            
            {filteredEvents.length === 0 && (
              <div className="col-span-full text-center py-20 text-gray-400">
                No events found. Check back soon!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Purchase Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl max-w-md w-full border border-gray-700">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">{selectedEvent.event_name}</h2>
              <div className="text-purple-400 text-sm mb-4">{selectedEvent.event_type}</div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-400">Date</span>
                  <span>{formatDate(selectedEvent.start_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Location</span>
                  <span>{selectedEvent.location_name || selectedEvent.venue?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Ticket Price</span>
                  <span className="font-bold text-green-400">
                    Rp {selectedEvent.ticket_price?.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Available</span>
                  <span>{selectedEvent.total_tickets - selectedEvent.sold_tickets}</span>
                </div>
              </div>
              
              <div className="bg-purple-900/30 p-4 rounded-xl mb-6">
                <div className="text-sm text-purple-300">
                  🎟️ Your ticket includes QR code for entry
                  {selectedEvent.has_friend_tracking && ' + friend tracking'}
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => purchaseTicket(selectedEvent.id)}
                  className="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded-xl font-medium"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
