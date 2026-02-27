'use client';

import { useState } from 'react';

const packages = [
  {
    id: 'standard',
    name: 'Standard',
    price: 50000000,
    features: [
      'Private room rental (4 hours)',
      'Basic AV equipment',
      'Welcome drinks for 50 guests',
      'Standard menu selection',
      'Dedicated event coordinator'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 100000000,
    features: [
      'Full venue rental (6 hours)',
      'Professional AV & lighting',
      'Premium open bar for 50 guests',
      'Customized gourmet menu',
      'Live entertainment option',
      'VIP welcome experience'
    ]
  },
  {
    id: 'luxury',
    name: 'Luxury',
    price: 250000000,
    features: [
      'Full venue exclusive (8 hours)',
      'Full production team',
      'Premium open bar unlimited',
      'Michelin-star catering option',
      'Celebrity performer booking',
      'Helicopter transfer option',
      '24/7 dedicated concierge'
    ]
  }
];

export default function CorporatePage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Company info
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    contactPerson: '',
    // Event info
    eventName: '',
    eventDate: '',
    guestCount: 50,
    packageType: 'standard',
    specialRequests: ''
  });

  const [submitted, setSubmitted] = useState(false);

  function handleChange(field: string, value: string | number) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  function handleSubmit() {
    // In production, this would call an API
    console.log('Submitting corporate inquiry:', formData);
    setSubmitted(true);
  }

  const selectedPackage = packages.find(p => p.id === formData.packageType);

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-3xl font-bold mb-4">Inquiry Submitted!</h1>
          <p className="text-gray-400 mb-6">
            Thank you for your interest. Our corporate events team will contact you within 24 hours.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setStep(1);
              setFormData({
                companyName: '',
                companyEmail: '',
                companyPhone: '',
                contactPerson: '',
                eventName: '',
                eventDate: '',
                guestCount: 50,
                packageType: 'standard',
                specialRequests: ''
              });
            }}
            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-medium"
          >
            Submit Another Inquiry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Hero */}
      <div className="relative h-64 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 to-blue-900/80"></div>
        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-20"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-5xl font-bold mb-2">🏢 Corporate Events</h1>
          <p className="text-xl text-purple-200">Exclusive experiences for your team</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Progress */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= s ? 'bg-purple-600' : 'bg-gray-700'
              }`}>
                {s}
              </div>
              {s < 3 && (
                <div className={`w-16 h-1 ${step > s ? 'bg-purple-600' : 'bg-gray-700'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Company Info */}
        {step === 1 && (
          <div className="bg-gray-800/40 rounded-2xl p-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-6">Company Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Company Name *</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3"
                  placeholder="PT ABC Indonesia"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Company Email *</label>
                <input
                  type="email"
                  value={formData.companyEmail}
                  onChange={(e) => handleChange('companyEmail', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3"
                  placeholder="events@company.com"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.companyPhone}
                  onChange={(e) => handleChange('companyPhone', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3"
                  placeholder="+62 812 3456 7890"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Contact Person *</label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => handleChange('contactPerson', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3"
                  placeholder="John Doe"
                />
              </div>
            </div>
            
            <button
              onClick={() => setStep(2)}
              disabled={!formData.companyName || !formData.companyEmail || !formData.contactPerson}
              className="w-full mt-6 bg-purple-600 hover:bg-purple-700 py-3 rounded-xl font-bold disabled:opacity-50"
            >
              Next: Event Details →
            </button>
          </div>
        )}

        {/* Step 2: Event Details */}
        {step === 2 && (
          <div className="bg-gray-800/40 rounded-2xl p-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-6">Event Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Event Name *</label>
                <input
                  type="text"
                  value={formData.eventName}
                  onChange={(e) => handleChange('eventName', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3"
                  placeholder="Annual Company Gala"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Event Date *</label>
                <input
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => handleChange('eventDate', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Expected Guests *</label>
                <input
                  type="range"
                  min={10}
                  max={500}
                  value={formData.guestCount}
                  onChange={(e) => handleChange('guestCount', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-center font-bold text-2xl text-purple-400">
                  {formData.guestCount} guests
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-xl font-medium"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!formData.eventName || !formData.eventDate}
                className="flex-1 bg-purple-600 hover:bg-purple-700 py-3 rounded-xl font-bold disabled:opacity-50"
              >
                Next: Select Package →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Package Selection */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Select Your Package</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {packages.map(pkg => (
                <button
                  key={pkg.id}
                  onClick={() => handleChange('packageType', pkg.id)}
                  className={`p-5 rounded-2xl border-2 text-left transition-all ${
                    formData.packageType === pkg.id
                      ? 'border-purple-500 bg-purple-600/20'
                      : 'border-gray-700 bg-gray-800/40 hover:border-gray-600'
                  }`}
                >
                  <div className="text-xl font-bold mb-2">{pkg.name}</div>
                  <div className="text-2xl font-bold text-green-400 mb-4">
                    Rp {(pkg.price / 1000000).toFixed(0)}jt
                  </div>
                  <ul className="space-y-2 text-sm text-gray-400">
                    {pkg.features.slice(0, 3).map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-green-400">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>

            {/* Selected Package Details */}
            {selectedPackage && (
              <div className="bg-gray-800/40 rounded-2xl p-6 border border-gray-700">
                <h3 className="text-lg font-bold mb-4">{selectedPackage.name} Package Includes:</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedPackage.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-300">
                      <span className="text-green-400">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Special Requests */}
            <div className="bg-gray-800/40 rounded-2xl p-6 border border-gray-700">
              <label className="block text-sm text-gray-400 mb-2">Special Requests (optional)</label>
              <textarea
                value={formData.specialRequests}
                onChange={(e) => handleChange('specialRequests', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 h-24 resize-none"
                placeholder="Tell us about any specific requirements..."
              />
            </div>

            {/* Summary */}
            <div className="bg-purple-900/30 rounded-2xl p-6 border border-purple-500/30">
              <h3 className="text-lg font-bold mb-4">Inquiry Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Company</span>
                  <span>{formData.companyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Event</span>
                  <span>{formData.eventName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Date</span>
                  <span>{formData.eventDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Guests</span>
                  <span>{formData.guestCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Package</span>
                  <span className="font-bold text-green-400">
                    Rp {(selectedPackage?.price || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-xl font-medium"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded-xl font-bold"
              >
                Submit Inquiry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
