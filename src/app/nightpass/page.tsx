/**
 * =====================================================
 * NIGHTPASS LANDING PAGE
 * AfterHoursID - Exclusive Noir Membership
 * =====================================================
 */

import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'NightPass - Exclusive Membership | AfterHoursID',
  description: 'Get exclusive access to Jakarta\'s hottest clubs with NightPass membership',
};

const PLANS = [
  {
    tier: 'silver',
    name: 'Silver NightPass',
    price: '299K',
    description: 'Perfect for weekend warriors',
    features: [
      '2 Free Club Entries',
      '1 Free Drink Monthly',
      'Priority Entry',
      '10% Venue Discount',
    ],
    color: 'from-gray-400 to-gray-600',
    popular: false,
  },
  {
    tier: 'gold',
    name: 'Gold NightPass',
    price: '599K',
    description: 'For the true nightlife enthusiast',
    features: [
      '5 Free Club Entries',
      '3 Free Drinks Monthly',
      'VIP Skip the Line',
      '2 Guest List Spots',
      '20% Venue Discount',
      'Exclusive Event Access',
    ],
    color: 'from-amber-400 to-yellow-600',
    popular: true,
  },
  {
    tier: 'platinum',
    name: 'Platinum NightPass',
    price: '999K',
    description: 'The ultimate nightlife experience',
    features: [
      'Unlimited VIP Entry',
      'Unlimited Free Drinks',
      'Unlimited Guest List',
      '30% Venue Discount',
      'Private Event Access',
      'Personal Concierge',
    ],
    color: 'from-purple-400 to-purple-700',
    popular: false,
  },
];

export default function NightpassPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-amber-900/20" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
        
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-pulse" />
        
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center">
            <span className="inline-block px-4 py-2 bg-gold-500/20 border border-gold-500/30 rounded-full text-gold-400 text-sm font-medium mb-6">
              ✦ EXCLUSIVE MEMBERSHIP ✦
            </span>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-gold-400 via-amber-500 to-gold-400 bg-clip-text text-transparent">
                NightPass
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              Unlock Jakarta's most exclusive nightlife. Skip the line, get free drinks, 
              and enjoy VIP access to the city's hottest venues.
            </p>
            
            <div className="flex gap-4 justify-center">
              <a
                href="#plans"
                className="px-8 py-4 bg-gradient-to-r from-gold-500 to-amber-500 text-black font-bold rounded-xl hover:shadow-lg hover:shadow-gold-500/30 transition-all btn-spring"
              >
                View Plans
              </a>
              <a
                href="#how-it-works"
                className="px-8 py-4 border-2 border-gray-600 text-white font-medium rounded-xl hover:border-gold-500 hover:text-gold-400 transition-all"
              >
                How It Works
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="how-it-works" className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            <span className="text-gold-400">How It Works</span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Choose Your Plan',
                description: 'Select the membership tier that fits your nightlife style',
              },
              {
                step: '02',
                title: 'Get Your Digital Pass',
                description: 'Receive your dynamic QR code that updates every 60 seconds',
              },
              {
                step: '03',
                title: 'Enjoy VIP Access',
                description: 'Skip the line, get free drinks, and exclusive entry to events',
              },
            ].map((item) => (
              <div key={item.step} className="glass-card p-8 text-center">
                <span className="text-4xl font-bold text-gold-500/50 mb-4 block">
                  {item.step}
                </span>
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="plans" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">
            <span className="text-white">Choose Your</span>{' '}
            <span className="text-gold-400">NightPass</span>
          </h2>
          <p className="text-gray-400 text-center mb-12">
            Cancel anytime. Benefits reset monthly.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {PLANS.map((plan) => (
              <div
                key={plan.tier}
                className={`
                  relative glass-card p-8 
                  ${plan.popular ? 'border-gold-500 border-2' : 'border-gray-700'}
                  hover:border-gold-400 transition-all card-lift-glow
                `}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gold-500 text-black text-sm font-bold rounded-full">
                    MOST POPULAR
                  </div>
                )}
                
                <div className={`text-center mb-6`}>
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm">{plan.description}</p>
                </div>
                
                <div className="text-center mb-8">
                  <span className="text-4xl font-bold text-white">
                    Rp {plan.price}
                  </span>
                  <span className="text-gray-400">/month</span>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-300">
                      <span className="text-gold-400">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <button
                  className={`
                    w-full py-3 rounded-xl font-semibold transition-all btn-spring
                    ${plan.popular 
                      ? 'bg-gradient-to-r from-gold-500 to-amber-500 text-black hover:shadow-lg hover:shadow-gold-500/30' 
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                    }
                  `}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            <span className="text-gold-400">Why NightPass?</span>
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: '⚡',
                title: 'Skip the Line',
                description: 'Never wait in queue again with priority entry',
              },
              {
                icon: '🍸',
                title: 'Free Drinks',
                description: 'Complementary drinks at partner venues',
              },
              {
                icon: '🎫',
                title: 'Exclusive Events',
                description: 'Get access to members-only parties',
              },
              {
                icon: '💰',
                title: 'Save Money',
                description: 'Up to 30% off on venue bookings',
              },
            ].map((benefit) => (
              <div key={benefit.title} className="text-center p-6">
                <span className="text-4xl mb-4 block">{benefit.icon}</span>
                <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
                <p className="text-gray-400 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Elevate Your Nightlife?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of members who never miss a night out.
          </p>
          <button className="px-12 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all btn-spring">
            Get NightPass Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500 text-sm">
          <p>© 2024 AfterHoursID. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
