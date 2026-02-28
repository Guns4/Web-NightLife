'use client';

import { useState, useEffect } from 'react';
import { MapPin, AlertCircle, Check } from 'lucide-react';

interface GPSConsentCheckboxProps {
  onConsentChange?: (consent: boolean) => void;
  required?: boolean;
  defaultValue?: boolean;
}

export function GPSConsentCheckbox({ 
  onConsentChange, 
  required = true,
  defaultValue = false 
}: GPSConsentCheckboxProps) {
  const [consented, setConsented] = useState(defaultValue);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check localStorage for existing consent
    const stored = localStorage.getItem('gps_consent');
    if (stored !== null) {
      setConsented(stored === 'true');
    }
  }, []);

  const handleConsentChange = (checked: boolean) => {
    setConsented(checked);
    localStorage.setItem('gps_consent', String(checked));
    onConsentChange?.(checked);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="mt-1">
          <input
            type="checkbox"
            id="gps-consent"
            checked={consented}
            onChange={(e) => handleConsentChange(e.target.checked)}
            className="w-5 h-5 rounded border-white/20 bg-white/5 text-[#D4AF37] focus:ring-[#D4AF37] focus:ring-offset-0"
          />
        </div>
        <div className="flex-1">
          <label 
            htmlFor="gps-consent" 
            className="flex items-center gap-2 text-sm text-gray-200 cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-[#D4AF37]" />
            <span className="font-medium">
              Saya setuju membagikan lokasi saya secara akurat untuk fitur Verified Visit
            </span>
            {required && <span className="text-red-400">*</span>}
          </label>
          
          <p className="text-xs text-gray-400 mt-1">
            Dengan mencentang ini, Anda memungkinkan kami memverifikasi kunjungan Anda secara akurat 
            untuk meningkatkan Trust Score venue dan pengalaman lainnya.
          </p>
          
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-[#D4AF37] hover:underline mt-2 flex items-center gap-1"
          >
            {showDetails ? 'Sembunyikan' : 'Pelajari selengkapnya'}
          </button>
          
          {showDetails && (
            <div className="mt-3 p-3 bg-black/20 rounded-lg text-xs text-gray-300 space-y-2">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <p>Verifikasi kunjungan Anda ke venue secara otomatis</p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <p>Membantu venue membangun Trust Score yang kredibel</p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <p>Dapat mengklaim reward dan promo eksklusif</p>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <p>Lokasi Anda tidak akan pernah dibagikan ke publik</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to check GPS consent status
 */
export function useGPSConsent() {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('gps_consent');
    setHasConsent(stored === 'true');
  }, []);

  const grantConsent = () => {
    localStorage.setItem('gps_consent', 'true');
    setHasConsent(true);
  };

  const revokeConsent = () => {
    localStorage.setItem('gps_consent', 'false');
    setHasConsent(false);
  };

  return {
    hasConsent,
    grantConsent,
    revokeConsent,
    isLoading: hasConsent === null,
  };
}
