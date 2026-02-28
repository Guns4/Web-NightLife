'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Types
interface ProfileData {
  displayName: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  location: string;
  interests: string[];
  venueName?: string;
  venueAddress?: string;
  venueType?: 'club' | 'bar' | 'restaurant' | 'lounge';
  businessLicense?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  profileComplete?: boolean;
}

interface Props {
  user: User | null;
  onComplete: (data: ProfileData) => Promise<void>;
}

const INTERESTS = [
  'Nightlife', 'Live Music', 'DJ Sets', 'Craft Cocktails', 'Fine Dining',
  'Rooftop Bars', 'Live Sports', 'Wine Tasting', 'Beer Gardens', 'Late Night Eats',
  'VIP Experience', 'Social Dancing', 'Karaoke', 'Comedy', 'Arts & Culture'
];

const VENUE_TYPES = [
  { value: 'club', label: 'Nightclub' },
  { value: 'bar', label: 'Bar' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'lounge', label: 'Lounge' },
];

export default function ProfileCompletionWizard({ user, onComplete }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: user?.name || '',
    phone: '',
    dateOfBirth: '',
    gender: 'prefer_not_to_say',
    location: '',
    interests: [],
  });

  const isVenueManager = user?.role === 'VENUE_MANAGER' || user?.role === 'ADMIN';

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin');
    }
  }, [user, router]);

  const handleNext = () => {
    if (isVenueManager && step < 3) {
      setStep(step + 1);
    } else if (!isVenueManager && step < 2) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onComplete(profileData);
      if (user?.role === 'VENUE_MANAGER') {
        router.push('/dashboard/owner');
      } else {
        router.push('/discovery');
      }
    } catch (error) {
      console.error('Profile update failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setProfileData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gold-400">Loading...</div>
      </div>
    );
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gold-400 mb-2">Welcome to AfterHours! 🎉</h2>
        <p className="text-gray-400">Let's set up your profile to personalize your experience</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gold-300 mb-2">Display Name</label>
          <input
            type="text"
            value={profileData.displayName}
            onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
            className="w-full bg-gray-900/50 border border-gold-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all"
            placeholder="How should we call you?"
          />
        </div>

        <div>
          <label className="block text-sm text-gold-300 mb-2">Phone Number</label>
          <input
            type="tel"
            value={profileData.phone}
            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
            className="w-full bg-gray-900/50 border border-gold-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all"
            placeholder="+62 xxx xxxx xxxx"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gold-300 mb-2">Date of Birth</label>
            <input
              type="date"
              value={profileData.dateOfBirth}
              onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
              className="w-full bg-gray-900/50 border border-gold-500/30 rounded-lg px-4 py-3 text-white focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm text-gold-300 mb-2">Gender</label>
            <select
              value={profileData.gender}
              onChange={(e) => setProfileData({ ...profileData, gender: e.target.value as ProfileData['gender'] })}
              className="w-full bg-gray-900/50 border border-gold-500/30 rounded-lg px-4 py-3 text-white focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gold-300 mb-2">Location</label>
          <input
            type="text"
            value={profileData.location}
            onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
            className="w-full bg-gray-900/50 border border-gold-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all"
            placeholder="Jakarta, Bandung, Bali..."
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gold-400 mb-2">What are you into?</h2>
        <p className="text-gray-400">Select your interests to get personalized recommendations</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {INTERESTS.map((interest) => (
          <button
            key={interest}
            onClick={() => toggleInterest(interest)}
            className={`p-3 rounded-lg border transition-all duration-300 ${
              profileData.interests.includes(interest)
                ? 'bg-gold-500/20 border-gold-500 text-gold-400'
                : 'bg-gray-900/30 border-gray-700 text-gray-400 hover:border-gold-500/50'
            }`}
          >
            {interest}
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gold-400 mb-2">Tell us about your venue</h2>
        <p className="text-gray-400">Complete your venue details to start managing</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gold-300 mb-2">Venue Name</label>
          <input
            type="text"
            value={profileData.venueName || ''}
            onChange={(e) => setProfileData({ ...profileData, venueName: e.target.value })}
            className="w-full bg-gray-900/50 border border-gold-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all"
            placeholder="The Golden Lounge"
          />
        </div>

        <div>
          <label className="block text-sm text-gold-300 mb-2">Venue Address</label>
          <input
            type="text"
            value={profileData.venueAddress || ''}
            onChange={(e) => setProfileData({ ...profileData, venueAddress: e.target.value })}
            className="w-full bg-gray-900/50 border border-gold-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all"
            placeholder="Jl. Sudirman No. XX, Jakarta"
          />
        </div>

        <div>
          <label className="block text-sm text-gold-300 mb-2">Venue Type</label>
          <div className="grid grid-cols-2 gap-3">
            {VENUE_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setProfileData({ ...profileData, venueType: type.value as ProfileData['venueType'] })}
                className={`p-3 rounded-lg border transition-all ${
                  profileData.venueType === type.value
                    ? 'bg-gold-500/20 border-gold-500 text-gold-400'
                    : 'bg-gray-900/30 border-gray-700 text-gray-400 hover:border-gold-500/50'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gold-300 mb-2">Business License (NIB)</label>
          <input
            type="text"
            value={profileData.businessLicense || ''}
            onChange={(e) => setProfileData({ ...profileData, businessLicense: e.target.value })}
            className="w-full bg-gray-900/50 border border-gold-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all"
            placeholder="Nomor Induk Berusaha"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                step >= s
                  ? 'bg-gold-500 text-gray-900'
                  : 'bg-gray-800 text-gray-500'
              }`}>
                {s}
              </div>
              {s < (isVenueManager ? 3 : 2) && (
                <div className={`w-16 h-1 mx-2 ${
                  step > s ? 'bg-gold-500' : 'bg-gray-800'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Form container */}
        <div className="bg-gray-900/80 backdrop-blur-xl border border-gold-500/20 rounded-2xl p-8 shadow-2xl">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && isVenueManager && renderStep3()}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-800">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                step === 1
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gold-400 hover:bg-gold-500/10'
              }`}
            >
              Back
            </button>

            {step < (isVenueManager ? 3 : 2) ? (
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-gray-900 rounded-lg font-bold hover:from-gold-400 hover:to-gold-500 transition-all shadow-lg shadow-gold-500/20"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-gray-900 rounded-lg font-bold hover:from-gold-400 hover:to-gold-500 transition-all shadow-lg shadow-gold-500/20 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Complete Profile'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
