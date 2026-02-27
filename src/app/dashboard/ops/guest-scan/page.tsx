'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface GuestEntry {
  id: string;
  guest_name: string;
  guest_phone: string;
  guest_email: string;
  status: string;
  is_vip: boolean;
  is_influencer: boolean;
  guest_list: {
    event_name: string;
    venue: { name: string };
  };
}

export default function GuestScanPage() {
  const [scannedCode, setScannedCode] = useState<string>('');
  const [guest, setGuest] = useState<GuestEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [manualEntry, setManualEntry] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!manualEntry && inputRef.current) {
      inputRef.current.focus();
    }
  }, [manualEntry]);

  async function handleScan(code: string) {
    if (!code.trim()) return;
    
    setLoading(true);
    setScannedCode(code);
    setResult(null);
    setErrorMessage('');
    
    try {
      // Try to find guest list entry first
      const { data: entry, error } = await supabase
        .from('guest_list_entries')
        .select('*, guest_list:guest_list_id(event_name, venue:venues(name))')
        .eq('qr_code', code.trim())
        .single();
      
      if (error || !entry) {
        // Try event ticket
        const { data: ticket } = await supabase
          .from('event_tickets')
          .select('*, event:event_id(event_name, start_date)')
          .eq('qr_code', code.trim())
          .single();
        
        if (ticket) {
          if (ticket.is_checked_in) {
            setResult('error');
            setErrorMessage('Ticket already used!');
          } else {
            // Check in ticket
            await supabase
              .from('event_tickets')
              .update({ is_checked_in: true, checked_in_at: new Date().toISOString() })
              .eq('id', ticket.id);
            
            setGuest({
              id: ticket.id,
              guest_name: ticket.user_id ? 'Ticket Holder' : 'Guest',
              guest_phone: '',
              guest_email: '',
              status: 'checked_in',
              is_vip: false,
              is_influencer: false,
              guest_list: {
                event_name: ticket.event?.event_name || 'Event',
                venue: { name: 'Event Venue' }
              }
            } as any);
            setResult('success');
            addToRecentScans({ name: 'Event Ticket', status: 'checked_in' });
          }
        } else {
          setResult('error');
          setErrorMessage('Invalid QR code. Guest not found.');
        }
      } else {
        if (entry.status === 'checked_in') {
          setResult('error');
          setErrorMessage('Guest already checked in!');
        } else if (entry.status === 'cancelled') {
          setResult('error');
          setErrorMessage('This entry has been cancelled.');
        } else {
          // Check in guest
          await supabase
            .from('guest_list_entries')
            .update({
              status: 'checked_in',
              checked_in_at: new Date().toISOString()
            })
            .eq('id', entry.id);
          
          setGuest(entry as any);
          setResult('success');
          addToRecentScans({ name: entry.guest_name, status: 'checked_in' });
        }
      }
    } catch (err) {
      setResult('error');
      setErrorMessage('Error processing scan');
    }
    
    setLoading(false);
    
    // Auto-clear after 3 seconds
    setTimeout(() => {
      setScannedCode('');
      setGuest(null);
      setResult(null);
    }, 3000);
  }

  function addToRecentScans(scan: { name: string; status: string }) {
    setRecentScans(prev => [{
      id: Date.now(),
      ...scan,
      time: new Date().toLocaleTimeString()
    }, ...prev.slice(0, 9)]);
  }

  function handleManualSubmit() {
    handleScan(manualCode);
    setManualCode('');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">🎫 Fast-Track Scanner</h1>
          <p className="text-purple-300">Scan QR codes for instant check-in</p>
        </div>

        {/* Scanner Area */}
        <div className="bg-gray-800/40 rounded-2xl p-8 border border-gray-700 mb-6">
          {!manualEntry ? (
            <>
              <div className="text-center mb-6">
                <div className="w-32 h-32 mx-auto mb-4 bg-gray-700/50 rounded-2xl flex items-center justify-center">
                  <svg className="w-16 h-16 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <p className="text-gray-400">Position QR code in frame</p>
                <p className="text-sm text-gray-500">or</p>
              </div>
              
              <input
                ref={inputRef}
                type="text"
                value={scannedCode}
                onChange={(e) => handleScan(e.target.value)}
                placeholder="Scan or type QR code..."
                className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-4 text-center text-lg font-mono"
                autoFocus
              />
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Enter QR Code Manually</label>
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Enter code..."
                  className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-4 text-center font-mono"
                  autoFocus
                />
              </div>
              <button
                onClick={handleManualSubmit}
                disabled={!manualCode.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 py-4 rounded-xl font-bold disabled:opacity-50"
              >
                Check In
              </button>
            </div>
          )}
          
          <button
            onClick={() => setManualEntry(!manualEntry)}
            className="w-full mt-4 text-purple-400 hover:text-purple-300 text-sm"
          >
            {manualEntry ? 'Use Scanner' : 'Enter Code Manually'}
          </button>
        </div>

        {/* Result Display */}
        {result && (
          <div className={`rounded-2xl p-8 text-center mb-6 ${
            result === 'success' 
              ? 'bg-green-600/20 border-2 border-green-500' 
              : 'bg-red-600/20 border-2 border-red-500'
          }`}>
            {result === 'success' ? (
              <>
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-2xl font-bold mb-2">Welcome!</h2>
                <div className="text-xl font-semibold">{guest?.guest_name}</div>
                {guest?.is_vip && (
                  <span className="inline-block mt-2 bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-sm">
                    VIP Guest
                  </span>
                )}
                {guest?.is_influencer && (
                  <span className="inline-block mt-2 ml-2 bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm">
                    Influencer
                  </span>
                )}
                <div className="text-gray-400 mt-2">{guest?.guest_list?.event_name}</div>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">❌</div>
                <h2 className="text-2xl font-bold mb-2">Check-In Failed</h2>
                <div className="text-red-300">{errorMessage}</div>
              </>
            )}
          </div>
        )}

        {/* Recent Scans */}
        <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700">
          <h3 className="font-semibold mb-3">Recent Scans</h3>
          <div className="space-y-2">
            {recentScans.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No recent scans</p>
            ) : (
              recentScans.map(scan => (
                <div key={scan.id} className="flex justify-between items-center py-2 border-b border-gray-700/50 last:border-0">
                  <span>{scan.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${
                      scan.status === 'checked_in' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {scan.status === 'checked_in' ? '✓ Checked In' : '✕ Failed'}
                    </span>
                    <span className="text-gray-500 text-xs">{scan.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-gray-800/30 rounded-xl p-4 text-center border border-gray-700">
            <div className="text-2xl font-bold text-green-400">{recentScans.filter(s => s.status === 'checked_in').length}</div>
            <div className="text-xs text-gray-400">Checked In</div>
          </div>
          <div className="bg-gray-800/30 rounded-xl p-4 text-center border border-gray-700">
            <div className="text-2xl font-bold text-red-400">{recentScans.filter(s => s.status !== 'checked_in').length}</div>
            <div className="text-xs text-gray-400">Failed</div>
          </div>
          <div className="bg-gray-800/30 rounded-xl p-4 text-center border border-gray-700">
            <div className="text-2xl font-bold text-purple-400">{recentScans.length}</div>
            <div className="text-xs text-gray-400">Total</div>
          </div>
        </div>
      </div>
    </div>
  );
}
