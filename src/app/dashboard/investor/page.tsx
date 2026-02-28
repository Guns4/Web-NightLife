'use client';

/**
 * =====================================================
 * INVESTOR DASHBOARD - EXECUTIVE COMMAND CENTER
 * AfterHoursID - Cinematic Investor Presentation
 * =====================================================
 */

import { useEffect, useState, useRef } from 'react';

// Types
interface InvestorMetrics {
  ltv: number;
  cac: number;
  ltvToCac: number;
  totalTransactions: number;
  transactionGrowth: number;
  revenueGrowth: number;
  userGrowth: number;
  gmv: number;
  monthlyRecurringRevenue: number;
}

interface TransactionData {
  month: string;
  transactions: number;
  volume: number;
  growth: number;
}

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Animated Counter Component
function AnimatedCounter({ 
  value, 
  prefix = '', 
  suffix = '', 
  duration = 2000,
  color = 'white'
}: { 
  value: number; 
  prefix?: string; 
  suffix?: string;
  duration?: number;
  color?: string;
}) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  useEffect(() => {
    if (!isVisible) return;
    
    let startTime: number;
    let animationFrame: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(easeOutQuart * value);
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isVisible, value, duration]);
  
  const displayValue = color === 'green' 
    ? count.toFixed(1) 
    : Math.round(count).toLocaleString('id-ID');
  
  return (
    <span 
      ref={ref} 
      className={`font-mono font-bold bg-gradient-to-r from-${color}-400 to-${color}-300 bg-clip-text text-transparent`}
    >
      {prefix}{displayValue}{suffix}
    </span>
  );
}

// Growth Sparkline
function GrowthSparkline({ data, color = 'cyan' }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon 
        points={`0,100 ${points} 100,100`} 
        fill={`url(#gradient-${color})`} 
        className={`text-${color}-500`}
      />
      <polyline 
        points={points} 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
        className={`text-${color}-400`}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Metric Card
function MetricCard({ 
  title, 
  value, 
  growth, 
  sparkline,
  color = 'cyan',
  delay = 0
}: { 
  title: string; 
  value: number; 
  growth: number;
  sparkline?: number[];
  color?: 'cyan' | 'purple' | 'amber' | 'green';
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);
  
  const colorClasses = {
    cyan: 'border-cyan-500/30 shadow-cyan-500/20',
    purple: 'border-purple-500/30 shadow-purple-500/20',
    amber: 'border-amber-500/30 shadow-amber-500/20',
    green: 'border-green-500/30 shadow-green-500/20',
  };
  
  const glowClasses = {
    cyan: 'group-hover:shadow-cyan-500/40',
    purple: 'group-hover:shadow-purple-500/40',
    amber: 'group-hover:shadow-amber-500/40',
    green: 'group-hover:shadow-green-500/40',
  };
  
  return (
    <div 
      ref={ref}
      className={`
        relative overflow-hidden rounded-2xl border bg-gray-900/80 backdrop-blur-xl p-8
        transition-all duration-700 ease-out transform
        ${colorClasses[color]} ${glowClasses[color]}
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
      `}
    >
      {/* Background glow */}
      <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full bg-${color}-500/10 blur-3xl`} />
      
      <div className="relative z-10">
        <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-3">{title}</p>
        
        <div className="flex items-end justify-between">
          <div>
            <AnimatedCounter 
              value={value} 
              prefix={title.includes('%') ? '' : 'Rp '}
              suffix={title.includes('%') ? '%' : ''}
              color={color}
            />
          </div>
          
          {sparkline && sparkline.length > 0 && (
            <div className="w-20 h-10">
              <GrowthSparkline data={sparkline} color={color} />
            </div>
          )}
        </div>
        
        <div className="mt-4 flex items-center gap-2">
          <span className={`text-sm font-medium text-${color}-400`}>
            {growth > 0 ? '↑' : '↓'} {Math.abs(growth).toFixed(1)}%
          </span>
          <span className="text-xs text-gray-500">vs last month</span>
        </div>
      </div>
    </div>
  );
}

// Transaction Chart
function TransactionChart({ data }: { data: TransactionData[] }) {
  const maxTransactions = Math.max(...data.map(d => d.transactions));
  
  return (
    <div className="relative h-64 flex items-end gap-3 px-4">
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2">
          <div className="w-full relative" style={{ height: '200px' }}>
            {/* Volume bar */}
            <div 
              className="absolute bottom-0 w-full bg-gradient-to-t from-purple-600/80 to-purple-400/60 rounded-t-md transition-all duration-1000 ease-out"
              style={{ 
                height: `${(item.volume / (maxTransactions * 500000)) * 100}%`,
                animationDelay: `${i * 150}ms`
              }}
            />
            {/* Transaction count overlay */}
            <div className="absolute top-0 left-0 right-0 text-center opacity-0 hover:opacity-100 transition-opacity">
              <p className="text-xs text-purple-300">{item.transactions.toLocaleString()} tx</p>
            </div>
          </div>
          <span className="text-xs text-gray-400">{item.month}</span>
        </div>
      ))}
    </div>
  );
}

// Fullscreen Presentation Mode
function PresentationButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full text-white font-semibold shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105 flex items-center gap-2"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
      </svg>
      Present Mode
    </button>
  );
}

export default function InvestorDashboardPage() {
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [metrics, setMetrics] = useState<InvestorMetrics | null>(null);
  
  // Simulated investor data
  const investorData: InvestorMetrics = {
    ltv: 2500000,
    cac: 450000,
    ltvToCac: 5.5,
    totalTransactions: 125000,
    transactionGrowth: 23.5,
    revenueGrowth: 45.2,
    userGrowth: 18.7,
    gmv: 85000000000,
    monthlyRecurringRevenue: 7200000000,
  };
  
  // Transaction history (12 months)
  const transactionHistory: TransactionData[] = [
    { month: 'Jan', transactions: 8500, volume: 3200000000, growth: 0 },
    { month: 'Feb', transactions: 9200, volume: 3500000000, growth: 8.2 },
    { month: 'Mar', transactions: 10100, volume: 3800000000, growth: 9.8 },
    { month: 'Apr', transactions: 9800, volume: 3700000000, growth: -2.9 },
    { month: 'May', transactions: 11200, volume: 4200000000, growth: 14.3 },
    { month: 'Jun', transactions: 12500, volume: 4700000000, growth: 11.6 },
    { month: 'Jul', transactions: 13800, volume: 5200000000, growth: 10.4 },
    { month: 'Aug', transactions: 15200, volume: 5700000000, growth: 10.1 },
    { month: 'Sep', transactions: 14100, volume: 5300000000, growth: -7.2 },
    { month: 'Oct', transactions: 16800, volume: 6300000000, growth: 19.1 },
    { month: 'Nov', transactions: 18500, volume: 6950000000, growth: 10.1 },
    { month: 'Dec', transactions: 21000, volume: 7900000000, growth: 13.5 },
  ];
  
  // Sparkline data
  const ltvSparkline = [1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.5];
  const cacSparkline = [0.52, 0.50, 0.48, 0.47, 0.46, 0.45, 0.45];
  
  // Toggle presentation mode
  const togglePresentation = () => {
    setIsPresentationMode(!isPresentationMode);
    if (!isPresentationMode) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };
  
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPresentationMode) {
        setIsPresentationMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresentationMode]);
  
  return (
    <div className={`
      min-h-screen bg-black text-white transition-all duration-700
      ${isPresentationMode ? 'p-0' : 'p-8'}
    `}>
      {/* Header - Hidden in presentation mode */}
      {!isPresentationMode && (
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-gray-500 uppercase tracking-widest">Live</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-amber-400 bg-clip-text text-transparent">
              Investor Dashboard
            </h1>
            <p className="text-gray-400 mt-2">Executive Command Center • AfterHoursID</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Last Updated</p>
            <p className="font-mono text-cyan-400">{new Date().toLocaleString('id-ID')}</p>
          </div>
        </div>
      )}
      
      {/* Presentation Mode Header */}
      {isPresentationMode && (
        <div className="absolute top-6 left-6 z-50 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-green-400 font-mono">LIVE</span>
          </div>
          <h1 className="text-2xl font-bold text-white">AfterHoursID</h1>
        </div>
      )}
      
      {/* Main Grid */}
      <div className={`${isPresentationMode ? 'h-screen p-8' : 'space-y-8'}`}>
        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard 
            title="Lifetime Value (LTV)"
            value={investorData.ltv}
            growth={25.3}
            sparkline={ltvSparkline}
            color="cyan"
            delay={100}
          />
          <MetricCard 
            title="CAC"
            value={investorData.cac}
            growth={-8.2}
            sparkline={cacSparkline}
            color="purple"
            delay={200}
          />
          <MetricCard 
            title="LTV:CAC Ratio"
            value={investorData.ltvToCac}
            growth={36.5}
            color="green"
            delay={300}
          />
          <MetricCard 
            title="MRR"
            value={investorData.monthlyRecurringRevenue}
            growth={investorData.revenueGrowth}
            color="amber"
            delay={400}
          />
        </div>
        
        {/* Transaction Growth Chart */}
        <div className={`
          bg-gray-900/60 border border-gray-800 rounded-2xl p-8 backdrop-blur-xl
          transition-all duration-700 delay-500
          ${isPresentationMode ? 'h-[calc(100%-200px)]' : ''}
        `}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-200">Transaction Growth</h2>
              <p className="text-sm text-gray-500 mt-1">Monthly transactions (12 months)</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-400">
                  {investorData.totalTransactions.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Total Transactions</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-400">
                  +{investorData.transactionGrowth}%
                </p>
                <p className="text-xs text-gray-500">Growth</p>
              </div>
            </div>
          </div>
          
          <TransactionChart data={transactionHistory} />
          
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-800">
            <div className="text-center">
              <p className="text-3xl font-bold text-cyan-400">Rp 85T</p>
              <p className="text-xs text-gray-500 mt-1">Gross Merchandise Value</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-400">+45%</p>
              <p className="text-xs text-gray-500 mt-1">Revenue Growth YoY</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-400">+19%</p>
              <p className="text-xs text-gray-500 mt-1">User Growth YoY</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-400">4.8★</p>
              <p className="text-xs text-gray-500 mt-1">Avg Rating</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Presentation Button */}
      <PresentationButton onClick={togglePresentation} />
      
      {/* Presentation Mode Exit Hint */}
      {isPresentationMode && (
        <div className="fixed bottom-6 left-6 text-gray-500 text-xs">
          Press ESC to exit presentation mode
        </div>
      )}
    </div>
  );
}
