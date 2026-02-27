'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
}

interface GuestList {
  id: string;
  event_name: string;
  event_date: string;
  total_slots: number;
  confirmed_guests: number;
  waitlist_count: number;
  is_ladies_night: boolean;
  status: string;
}

interface GuestEntry {
  id: string;
  guest_name: string;
  guest_phone: string;
  guest_email: string;
  status: string;
  is_vip: boolean;
  is_influencer: boolean;
  created_at: string;
}

export default function GuestListPage() {
  const [guestLists, setGuestLists] = useState<GuestList[]>([]);
  const [selectedList, setSelectedList] = useState<GuestList | null>(null);
  const [entries, setEntries] = useState<GuestEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  
  // Form states
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newTotalSlots, setNewTotalSlots] = useState(100);
  const [isLadiesNight, setIsLadiesNight] = useState(false);
  
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestPhone, setNewGuestPhone] = useState('');
  const [newGuestEmail, setNewGuestEmail] = useState('');
  const [isVipGuest, setIsVipGuest] = useState(false);

  useEffect(() => {
    loadGuestLists();
  }, []);

  async function loadGuestLists() {
    setLoading(true);
    
    // Get user's venues
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data: venues } = await supabase
      .from('venues')
      .select('id')
      .eq('owner_id', user.id);
    
    if (!venues || venues.length === 0) {
      setGuestLists([]);
      setLoading(false);
      return;
    }
    
    const venueIds = venues.map(v => v.id);
    
    const { data: lists } = await supabase
      .from('guest_lists')
      .select('*')
      .in('venue_id', venueIds)
      .order('event_date', { ascending: false });
    
    setGuestLists(lists || []);
    setLoading(false);
  }

  async function loadEntries(listId: string) {
    const { data } = await supabase
      .from('guest_list_entries')
      .select('*')
      .eq('guest_list_id', listId)
      .order('created_at', { ascending: false });
    
    setEntries(data || []);
  }

  async function createGuestList() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data: venues } = await supabase
      .from('venues')
      .select('id')
      .eq('owner_id', user.id)
      .limit(1)
      .single();
    
    if (!venues) return;
    
    const { error } = await supabase
      .from('guest_lists')
      .insert({
        venue_id: venues.id,
        event_name: newEventName,
        event_date: newEventDate,
        total_slots: newTotalSlots,
        is_ladies_night: isLadiesNight
      });
    
    if (!error) {
      setShowCreateModal(false);
      setNewEventName('');
      setNewEventDate('');
      setNewTotalSlots(100);
      setIsLadiesNight(false);
      loadGuestLists();
    }
  }

  async function addGuest() {
    if (!selectedList) return;
    
    const qrCode = `GL${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    const { error } = await supabase
      .from('guest_list_entries')
      .insert({
        guest_list_id: selectedList.id,
        guest_name: newGuestName,
        guest_phone: newGuestPhone,
        guest_email: newGuestEmail,
        is_vip: isVipGuest,
        qr_code: qrCode
      });
    
    if (!error) {
      setShowAddGuestModal(false);
      setNewGuestName('');
      setNewGuestPhone('');
      setNewGuestEmail('');
      setIsVipGuest(false);
      loadEntries(selectedList.id);
      
      // Update count
      await supabase
        .from('guest_lists')
        .update({ confirmed_guests: selectedList.confirmed_guests + 1 })
        .eq('id', selectedList.id);
    }
  }

  async function checkInGuest(entryId: string) {
    const { error } = await supabase
      .from('guest_list_entries')
      .update({
        status: 'checked_in',
        checked_in_at: new Date().toISOString()
      })
      .eq('id', entryId);
    
    if (!error && selectedList) {
      loadEntries(selectedList.id);
    }
  }

  async function toggleListStatus(list: GuestList) {
    const newStatus = list.status === 'open' ? 'closed' : 'open';
    
    await supabase
      .from('guest_lists')
      .update({ status: newStatus })
      .eq('id', list.id);
    
    loadGuestLists();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Guest List Manager</h1>
            <p className="text-purple-300">Manage your events and guest entries</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Event
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="text-purple-400 text-sm">Total Events</div>
            <div className="text-3xl font-bold">{guestLists.length}</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="text-green-400 text-sm">Active Events</div>
            <div className="text-3xl font-bold">{guestLists.filter(l => l.status === 'open').length}</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="text-blue-400 text-sm">Total Guests</div>
            <div className="text-3xl font-bold">{guestLists.reduce((acc, l) => acc + l.confirmed_guests, 0)}</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="text-pink-400 text-sm">Ladies Nights</div>
            <div className="text-3xl font-bold">{guestLists.filter(l => l.is_ladies_night).length}</div>
          </div>
        </div>

        {/* Guest Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List of Events */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Events</h2>
            {guestLists.map(list => (
              <div
                key={list.id}
                onClick={() => {
                  setSelectedList(list);
                  loadEntries(list.id);
                }}
                className={`p-4 rounded-xl cursor-pointer transition-all ${
                  selectedList?.id === list.id
                    ? 'bg-purple-600/30 border-2 border-purple-500'
                    : 'bg-gray-800/30 border border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{list.event_name}</h3>
                  {list.is_ladies_night && (
                    <span className="bg-pink-500/20 text-pink-300 text-xs px-2 py-1 rounded-full">
                      Ladies Night
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-400 mb-2">
                  {formatDate(list.event_date)}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">
                    {list.confirmed_guests}/{list.total_slots} guests
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    list.status === 'open' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                  }`}>
                    {list.status}
                  </span>
                </div>
              </div>
            ))}
            
            {guestLists.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                No guest lists yet. Create your first event!
              </div>
            )}
          </div>

          {/* Guest Entries */}
          <div className="lg:col-span-2">
            {selectedList ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">
                    Guests - {selectedList.event_name}
                  </h2>
                  <button
                    onClick={() => setShowAddGuestModal(true)}
                    className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Guest
                  </button>
                </div>

                {/* Toggle Status */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleListStatus(selectedList)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      selectedList.status === 'open'
                        ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                        : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                    }`}
                  >
                    {selectedList.status === 'open' ? 'Close List' : 'Reopen List'}
                  </button>
                </div>

                {/* Guests Table */}
                <div className="bg-gray-800/30 rounded-xl border border-gray-700 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-800/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm text-gray-400">Guest</th>
                        <th className="px-4 py-3 text-left text-sm text-gray-400">Phone</th>
                        <th className="px-4 py-3 text-left text-sm text-gray-400">Status</th>
                        <th className="px-4 py-3 text-left text-sm text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {entries.map(entry => (
                        <tr key={entry.id} className="hover:bg-gray-700/30">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{entry.guest_name}</span>
                              {entry.is_vip && (
                                <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-0.5 rounded-full">VIP</span>
                              )}
                              {entry.is_influencer && (
                                <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-0.5 rounded-full">Influencer</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-400">{entry.guest_phone}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              entry.status === 'checked_in'
                                ? 'bg-green-500/20 text-green-300'
                                : entry.status === 'confirmed'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-gray-500/20 text-gray-300'
                            }`}>
                              {entry.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {entry.status === 'confirmed' && (
                              <button
                                onClick={() => checkInGuest(entry.id)}
                                className="text-green-400 hover:text-green-300 text-sm"
                              >
                                Check In
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {entries.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      No guests added yet
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-800/20 rounded-xl border border-gray-700">
                <p className="text-gray-400">Select an event to view guests</p>
              </div>
            )}
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
              <h2 className="text-xl font-bold mb-4">Create Guest List Event</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Event Name</label>
                  <input
                    type="text"
                    value={newEventName}
                    onChange={(e) => setNewEventName(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    placeholder="e.g., Saturday Night Vibes"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Event Date</label>
                  <input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Total Slots</label>
                  <input
                    type="number"
                    value={newTotalSlots}
                    onChange={(e) => setNewTotalSlots(parseInt(e.target.value))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    min={1}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="ladiesNight"
                    checked={isLadiesNight}
                    onChange={(e) => setIsLadiesNight(e.target.checked)}
                    className="w-4 h-4 rounded bg-gray-700 border-gray-600"
                  />
                  <label htmlFor="ladiesNight" className="text-sm">
                    This is a Ladies Night event
                  </label>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={createGuestList}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 py-2 rounded-lg font-medium"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Guest Modal */}
        {showAddGuestModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
              <h2 className="text-xl font-bold mb-4">Add Guest</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Guest Name *</label>
                  <input
                    type="text"
                    value={newGuestName}
                    onChange={(e) => setNewGuestName(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={newGuestPhone}
                    onChange={(e) => setNewGuestPhone(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={newGuestEmail}
                    onChange={(e) => setNewGuestEmail(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="vipGuest"
                    checked={isVipGuest}
                    onChange={(e) => setIsVipGuest(e.target.checked)}
                    className="w-4 h-4 rounded bg-gray-700 border-gray-600"
                  />
                  <label htmlFor="vipGuest" className="text-sm">VIP Guest</label>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddGuestModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={addGuest}
                  disabled={!newGuestName || !newGuestPhone}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  Add Guest
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
