/**
 * =====================================================
 * RSVP BUTTON & WHATSAPP SHARE
 * AfterHoursID - Verified Reviews System
 * =====================================================
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Share2, Check, Calendar, MapPin, Copy, CheckCircle2 } from 'lucide-react';
import { toggleRSVP, getUserRsvp, getVenueRsvps, getVenueShareLink } from '@/lib/services/rsvp-service';

interface RSVPButtonProps {
  venueId: string;
  venueName: string;
  userId?: string;
  userName?: string;
}

export default function RSVPButton({ 
  venueId, 
  venueName, 
  userId, 
  userName = 'Guest' 
}: RSVPButtonProps) {
  const [status, setStatus] = useState<'going' | 'interested' | null>(null);
  const [loading, setLoading] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [goingCount, setGoingCount] = useState(0);
  const [copied, setCopied] = useState(false);
  
  // Handle RSVP toggle
  const handleRSVP = async (newStatus: 'going' | 'interested') => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const result = await toggleRSVP(venueId, userId, userName);
      if (result.success) {
        const newStatus = result.rsvp?.status;
        if (newStatus === 'going' || newStatus === 'interested') {
          setStatus(newStatus);
        } else {
          setStatus(null);
        }
        
        // Update count
        const rsvps = await getVenueRsvps(venueId, 'going');
        setGoingCount(rsvps.length);
      }
    } catch (error) {
      console.error('RSVP error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle share
  const handleShare = async () => {
    const link = await getVenueShareLink(venueId, venueName);
    
    // Copy to clipboard
    await navigator.clipboard.writeText(link.deepLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    // Open WhatsApp
    window.open(link.whatsappLink, '_blank');
  };
  
  // Format count
  const formatCount = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  return (
    <div className="flex flex-col gap-3">
      {/* RSVP Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => handleRSVP('going')}
          disabled={loading}
          className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold
            transition-all duration-300
            ${status === 'going'
              ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
              : 'bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:bg-slate-800 hover:border-emerald-500/50'
            }
          `}
        >
          {status === 'going' ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              I'm Going!
            </>
          ) : (
            <>
              <Users className="w-5 h-5" />
              I'm Going
            </>
          )}
        </button>
        
        <button
          onClick={() => handleRSVP('interested')}
          disabled={loading}
          className={`
            px-4 py-3 rounded-xl font-medium
            transition-all duration-300
            ${status === 'interested'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-400/50'
              : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800'
            }
          `}
        >
          Interested
        </button>
      </div>
      
      {/* Going Count & Share */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowShare(!showShare)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <Users className="w-4 h-4" />
          <span className="font-medium text-white">{formatCount(goingCount)}</span> going tonight
        </button>
        
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30 transition-colors text-sm"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>
      
      {/* Share Panel */}
      <AnimatePresence>
        {showShare && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <h4 className="font-semibold text-white mb-3">Share with friends</h4>
              
              {/* WhatsApp Button */}
              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-[#25D366] text-white font-semibold hover:bg-[#20BD5A] transition-colors mb-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Share on WhatsApp
              </button>
              
              {/* Copy Link */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={`https://afterhours.id/venue/${venueId}`}
                  readOnly
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-sm"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://afterhours.id/venue/${venueId}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-3 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Who's Going List
 */
interface WhosGoingProps {
  venueId: string;
}

export function WhosGoing({ venueId }: WhosGoingProps) {
  const [rsvps, setRsvps] = useState<any[]>([]);
  
  // Load RSVPs
  // In production, use useEffect to load
  
  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-white flex items-center gap-2">
        <Users className="w-4 h-4" />
        Who's Going ({rsvps.length})
      </h4>
      
      <div className="flex -space-x-2">
        {rsvps.slice(0, 5).map((rsvp, idx) => (
          <div
            key={idx}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 border-2 border-slate-900 flex items-center justify-center text-white font-bold text-sm"
            title={rsvp.userName}
          >
            {rsvp.userName?.charAt(0).toUpperCase()}
          </div>
        ))}
        
        {rsvps.length > 5 && (
          <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-slate-400 text-xs">
            +{rsvps.length - 5}
          </div>
        )}
      </div>
    </div>
  );
}
