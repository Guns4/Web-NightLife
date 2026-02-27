'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Currency = 'IDR' | 'USD' | 'SGD' | 'AUD';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  convert: (amount: number, from?: Currency) => number;
  format: (amount: number, currency?: Currency) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Default exchange rates (would come from API in production)
const defaultRates: Record<Currency, number> = {
  IDR: 1,
  USD: 0.000062,
  SGD: 0.000084,
  AUD: 0.000095
};

const currencySymbols: Record<Currency, string> = {
  IDR: 'Rp',
  USD: '$',
  SGD: 'S$',
  AUD: 'A$'
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('IDR');
  const [rates, setRates] = useState(defaultRates);

  useEffect(() => {
    // In production, fetch from exchange rate API
    const fetchRates = async () => {
      try {
        const response = await fetch(
          'https://api.exchangerate-api.com/v4/latest/IDR'
        );
        const data = await response.json();
        
        setRates({
          IDR: 1,
          USD: 1 / data.rates.USD,
          SGD: 1 / data.rates.SGD,
          AUD: 1 / data.rates.AUD
        });
      } catch (error) {
        console.log('Using default exchange rates');
      }
    };
    
    fetchRates();
    // Refresh every hour
    const interval = setInterval(fetchRates, 3600000);
    return () => clearInterval(interval);
  }, []);

  const convert = (amount: number, from: Currency = 'IDR'): number => {
    if (from === currency) return amount;
    
    // Convert to IDR first, then to target currency
    const inIDR = from === 'IDR' ? amount : amount / defaultRates[from];
    return inIDR * defaultRates[currency];
  };

  const format = (amount: number, currencyOverride?: Currency): string => {
    const curr = currencyOverride || currency;
    const converted = convert(amount, 'IDR');
    
    if (curr === 'IDR') {
      return `Rp ${amount.toLocaleString('id-ID')}`;
    }
    
    return `${currencySymbols[curr]} ${converted.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convert, format }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
}
