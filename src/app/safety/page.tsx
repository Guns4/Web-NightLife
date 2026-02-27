'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface EmergencyContact {
  id: string;
  contact_name: string;
  contact_phone: string;
  relationship: string;
  is_primary: boolean;
}

interface SOSEvent {
  id: string;
  sos_type: string;
  description: string;
  status: string;
  latitude: number;
  longitude: number;
  created_at: string;
  responded_by?: string;
  response_notes?: string;
}

interface TransportOption {
  provider: string;
  estimate: string;
  link: string;
}

export default function SafetyPage() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [recentSOS, setRecentSOS] = useState<SOSEvent[]>([]);
  const [transportOptions, setTransportOptions] = useState<TransportOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddContact, setShowAddContact] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [sosType, setSosType] = useState<string>('safety');
  const [sosDescription, setSosDescription] = useState('');
  
  // Contact form
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRelationship, setNewRelationship] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  useEffect(() => {
    loadData();
    getLocation();
  }, []);

  async function loadData() {
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    
    // Load contacts
    const { data: contactsData } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false });
    
    setContacts(contactsData || []);
    
    // Load recent SOS
    const { data: sosData } = await supabase
      .from('sos_events')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    setRecentSOS(sosData || []);
    
    setLoading(false);
  }

  function getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          
          // Mock transport options
          setTransportOptions([
            {
              provider: 'GrabCar',
              estimate: '10-20 min • Rp 35,000-45,000',
              link: `https://grab.com/book?lat=${position.coords.latitude}&lng=${position.coords.longitude}`
            },
            {
              provider: 'GoCar',
              estimate: '12-22 min • Rp 38,000-48,000',
              link: `https://gojek.com/book?lat=${position.coords.latitude}&lng=${position.coords.longitude}`
            },
            {
              provider: 'Blue Bird',
              estimate: '15-25 min • Rp 50,000-70,000',
              link: '#'
            }
          ]);
        },
        () => {
          // Default to Jakarta
          setCurrentLocation({ lat: -6.2088, lng: 106.8456 });
        }
      );
    }
  }

  async function addContact() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { error } = await supabase
      .from('emergency_contacts')
      .insert({
        user_id: user.id,
        contact_name: newName,
        contact_phone: newPhone,
        relationship: newRelationship,
        is_primary: isPrimary
      });
    
    if (!error) {
      setShowAddContact(false);
      setNewName('');
      setNewPhone('');
      setNewRelationship('');
      setIsPrimary(false);
      loadData();
    }
  }

  async function deleteContact(id: string) {
    await supabase.from('emergency_contacts').delete().eq('id', id);
    loadData();
  }

  async function triggerSOS() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    if (!currentLocation) {
      alert('Unable to get your location');
      return;
    }
    
    const { error } = await supabase
      .from('sos_events')
      .insert({
        user_id: user.id,
        sos_type: sosType,
        description: sosDescription,
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        status: 'active'
      });
    
    if (!error) {
      alert('SOS sent! Help is on the way. Stay calm.');
      setShowSOSModal(false);
      setSosDescription('');
      loadData();
    }
  }

  const sosTypes = [
    { id: 'medical', label: 'Medical Emergency', icon: '🏥', color: 'bg-red-500' },
    { id: 'safety', label: 'Safety Concern', icon: '🛡️', color: 'bg-yellow-500' },
    { id: 'harassment', label: 'Harassment', icon: '🚫', color: 'bg-pink-500' },
    { id: 'emergency', label: 'Emergency', icon: '🚨', color: 'bg-red-600' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Hero */}
      <div className="relative h-48 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/80 to-pink-900/80"></div>
        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-20"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-4xl font-bold mb-2">🛡️ Home Safe</h1>
          <p className="text-xl text-red-200">Your safety is our priority</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        {/* SOS Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowSOSModal(true)}
            className="w-full bg-red-600 hover:bg-red-700 py-6 rounded-2xl font-bold text-2xl flex items-center justify-center gap-3 animate-pulse"
          >
            <span className="text-3xl">🆘</span>
            TRIGGER SOS
          </button>
          <p className="text-center text-gray-400 text-sm mt-2">
            Tap only in genuine emergencies
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button className="bg-gray-800 hover:bg-gray-700 p-4 rounded-xl border border-gray-700">
            <div className="text-2xl mb-2">📱</div>
            <div className="font-medium">Call Police</div>
            <div className="text-xs text-gray-400">110</div>
          </button>
          <button className="bg-gray-800 hover:bg-gray-700 p-4 rounded-xl border border-gray-700">
            <div className="text-2xl mb-2">🚑</div>
            <div className="font-medium">Ambulance</div>
            <div className="text-xs text-gray-400">118/119</div>
          </button>
        </div>

        {/* Transport */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">🚗 Get a Ride Home</h2>
          <div className="space-y-3">
            {transportOptions.map((transport, i) => (
              <a
                key={i}
                href={transport.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-gray-800/50 hover:bg-gray-800 p-4 rounded-xl border border-gray-700 flex justify-between items-center"
              >
                <div>
                  <div className="font-medium">{transport.provider}</div>
                  <div className="text-sm text-gray-400">{transport.estimate}</div>
                </div>
                <div className="text-purple-400">Book →</div>
              </a>
            ))}
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">📞 Emergency Contacts</h2>
            <button
              onClick={() => setShowAddContact(true)}
              className="text-purple-400 hover:text-purple-300 text-sm"
            >
              + Add
            </button>
          </div>
          
          <div className="space-y-3">
            {contacts.map(contact => (
              <div key={contact.id} className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{contact.contact_name}</span>
                    {contact.is_primary && (
                      <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-0.5 rounded-full">
                        Primary
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">{contact.contact_phone}</div>
                  <div className="text-xs text-gray-500">{contact.relationship}</div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`tel:${contact.contact_phone}`}
                    className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded-lg text-sm"
                  >
                    Call
                  </a>
                  <button
                    onClick={() => deleteContact(contact.id)}
                    className="text-gray-500 hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
            
            {contacts.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No emergency contacts added yet
              </div>
            )}
          </div>
        </div>

        {/* Recent SOS */}
        {recentSOS.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Recent SOS Activity</h2>
            <div className="space-y-2">
              {recentSOS.map(sos => (
                <div key={sos.id} className="bg-gray-800/30 p-3 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="capitalize">{sos.sos_type.replace('_', ' ')}</span>
                      <div className="text-xs text-gray-400">
                        {new Date(sos.created_at).toLocaleString('id-ID')}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      sos.status === 'resolved' ? 'bg-green-500/20 text-green-300' : 
                      sos.status === 'acknowledged' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      {sos.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Add Emergency Contact</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Phone</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Relationship</label>
                <input
                  type="text"
                  value={newRelationship}
                  onChange={(e) => setNewRelationship(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2"
                  placeholder="e.g., Parent, Friend"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="primary"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="primary" className="text-sm">Set as primary contact</label>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddContact(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={addContact}
                className="flex-1 bg-purple-600 hover:bg-purple-700 py-2 rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SOS Modal */}
      {showSOSModal && (
        <div className="fixed inset-0 bg-red-900/90 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-red-500">
            <h2 className="text-2xl font-bold mb-4 text-center">🆘 Trigger SOS</h2>
            
            <p className="text-center text-gray-400 mb-4">
              Select the type of emergency
            </p>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              {sosTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => setSosType(type.id)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    sosType === type.id
                      ? 'border-red-500 bg-red-500/20'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="text-sm">{type.label}</div>
                </button>
              ))}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Description (optional)</label>
              <textarea
                value={sosDescription}
                onChange={(e) => setSosDescription(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 h-20 resize-none"
                placeholder="Describe your situation..."
              />
            </div>
            
            <div className="bg-red-900/30 p-3 rounded-lg mb-4 text-sm">
              📍 Location: {currentLocation ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}` : 'Getting location...'}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowSOSModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-xl font-medium"
              >
                Cancel
              </button>
              <button
                onClick={triggerSOS}
                className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-xl font-bold animate-pulse"
              >
                SEND SOS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
