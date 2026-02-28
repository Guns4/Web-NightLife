/**
 * =====================================================
 * PROMO CHECKOUT PAGE
 * AfterHoursID - Automated Promo Engine
 * =====================================================
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Promo, TIER_PRICING } from '@/lib/services/promo-service';
import { getPromoById, activatePromo } from '@/lib/actions/promo.actions';

interface CheckoutPageProps {
  params: Promise<{ id: string }>;
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const [promo, setPromo] = useState<Promo | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    async function loadPromo() {
      const { id } = await params;
      const data = await getPromoById(id);
      setPromo(data);
      setLoading(false);
    }
    loadPromo();
  }, [params]);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };
  
  const handlePayment = async () => {
    if (!promo) return;
    
    setProcessing(true);
    setError('');
    
    try {
      // In production, this would call Midtrans/Xendit API
      // For demo, we'll simulate payment and activate the promo
      
      // Simulate payment delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result = await activatePromo(promo.id);
      
      if (result.success) {
        // Redirect to success page or show success message
        window.location.href = `/dashboard/owner/promos?success=true`;
      } else {
        setError(result.error || 'Payment failed');
      }
    } catch (err) {
      setError('Payment processing error');
    } finally {
      setProcessing(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }
  
  if (!promo) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Promo Not Found</h1>
          <Link href="/dashboard/owner/promos" className="text-cyan-400 hover:text-cyan-300">
            Back to Promos
          </Link>
        </div>
      </div>
    );
  }
  
  const tierInfo = TIER_PRICING[promo.tier];
  const start = new Date(promo.startDate);
  const end = new Date(promo.endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Complete Your Payment
        </h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
            <h2 className="text-xl font-bold text-white mb-4">Order Summary</h2>
            
            {/* Promo Preview */}
            <div className="relative h-40 w-full rounded-xl overflow-hidden mb-4">
              <Image
                src={promo.imageUrl}
                alt={promo.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <h3 className="text-white font-semibold">{promo.title}</h3>
              </div>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Plan</span>
                <span className={`font-semibold capitalize ${
                  promo.tier === 'platinum' ? 'text-purple-400' : 
                  promo.tier === 'gold' ? 'text-amber-400' : 'text-cyan-400'
                }`}>
                  {tierInfo.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Duration</span>
                <span className="text-white">{days} day{days > 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Start Date</span>
                <span className="text-white">{formatDate(promo.startDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">End Date</span>
                <span className="text-white">{formatDate(promo.endDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Boost Score</span>
                <span className="text-white">{promo.boostScore}x</span>
              </div>
            </div>
          </div>
          
          {/* Payment */}
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
            <h2 className="text-xl font-bold text-white mb-4">Payment Method</h2>
            
            {/* Payment Methods */}
            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700 cursor-pointer hover:border-cyan-400/50 transition-colors">
                <input type="radio" name="method" defaultChecked className="w-4 h-4 text-cyan-400" />
                <span className="text-white">QRIS</span>
                <span className="ml-auto text-xs text-slate-400">Instant</span>
              </label>
              <label className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700 cursor-pointer hover:border-cyan-400/50 transition-colors">
                <input type="radio" name="method" className="w-4 h-4 text-cyan-400" />
                <span className="text-white">GoPay</span>
              </label>
              <label className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700 cursor-pointer hover:border-cyan-400/50 transition-colors">
                <input type="radio" name="method" className="w-4 h-4 text-cyan-400" />
                <span className="text-white">OVO</span>
              </label>
              <label className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700 cursor-pointer hover:border-cyan-400/50 transition-colors">
                <input type="radio" name="method" className="w-4 h-4 text-cyan-400" />
                <span className="text-white">Bank Transfer</span>
              </label>
            </div>
            
            {/* Total */}
            <div className="border-t border-slate-700 pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total</span>
                <span className="text-2xl font-bold text-amber-400">
                  {formatCurrency(promo.budget)}
                </span>
              </div>
            </div>
            
            {/* Error */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
                {error}
              </div>
            )}
            
            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={processing}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                `Pay ${formatCurrency(promo.budget)}`
              )}
            </button>
            
            <p className="text-center text-xs text-slate-500 mt-4">
              By clicking Pay, you agree to our Terms of Service
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
