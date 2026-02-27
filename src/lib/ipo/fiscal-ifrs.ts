/**
 * GLOBAL CURRENCY & FISCAL ADAPTATION (IFRS)
 * Phase 9: Strategic Exit & IPO Preparation
 * 
 * Features:
 * - IFRS-compliant financial reporting
 * - Multi-currency support
 * - Currency translation for international reporting
 * - Fiscal year adaptation
 */

export const IFRS_CONFIG = {
  // Supported currencies
  currencies: {
    IDR: {
      code: 'IDR',
      name: 'Indonesian Rupiah',
      symbol: 'Rp',
      decimals: 0,
      locale: 'id-ID',
    },
    USD: {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      decimals: 2,
      locale: 'en-US',
    },
    EUR: {
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
      decimals: 2,
      locale: 'de-DE',
    },
    GBP: {
      code: 'GBP',
      name: 'British Pound',
      symbol: '£',
      decimals: 2,
      locale: 'en-GB',
    },
    SGD: {
      code: 'SGD',
      name: 'Singapore Dollar',
      symbol: 'S$',
      decimals: 2,
      locale: 'en-SG',
    },
  },
  
  // IFRS Standards relevant to our business
  standards: {
    ifrs15: {
      name: 'IFRS 15 - Revenue from Contracts',
      description: 'Revenue recognition from customer contracts',
      application: 'Ticket sales, subscriptions, partnerships',
    },
    ifrs16: {
      name: 'IFRS 16 - Leases',
      description: 'Lease accounting for venue rentals',
      application: 'Venue rent, office lease',
    },
    ifrs9: {
      name: 'IFRS 9 - Financial Instruments',
      description: 'Classification and measurement of financial assets',
      application: 'Receivables, investments',
    },
    ifrs2: {
      name: 'IFRS 2 - Share-based Payment',
      description: 'Employee stock options',
    },
    ifrs13: {
      name: 'IFRS 13 - Fair Value Measurement',
      description: 'Fair value measurement principles',
      application: 'Asset valuation, acquisitions',
    },
  },
  
  // Functional vs Reporting Currency
  functionalCurrency: 'IDR',
  reportingCurrency: 'USD',
  
  // Exchange rates (would be fetched from API)
  exchangeRates: {
    'IDR-USD': 0.000062,
    'IDR-EUR': 0.000057,
    'IDR-GBP': 0.000049,
    'IDR-SGD': 0.000083,
  },
  
  // Fiscal year
  fiscalYear: {
    start: 'January',
    end: 'December',
    reportingPeriods: ['Q1', 'Q2', 'Q3', 'Q4', 'Annual'],
  },
};

export interface CurrencyAmount {
  amount: number;
  currency: keyof typeof IFRS_CONFIG.currencies;
}

export interface FinancialStatement {
  period: string;
  currency: string;
  exchangeRate: number;
  // Statement of Financial Position (Balance Sheet)
  balanceSheet: {
    assets: {
      current: {
        cash: number;
        receivables: number;
        prepayments: number;
        inventory: number;
      };
      nonCurrent: {
        property: number;
        equipment: number;
        intangible: number;
        investments: number;
      };
    };
    liabilities: {
      current: {
        payables: number;
        accruals: number;
        deferredRevenue: number;
        loans: number;
      };
      nonCurrent: {
        loans: number;
        leases: number;
      };
    };
    equity: {
      shareCapital: number;
      retainedEarnings: number;
      otherReserves: number;
    };
  };
  // Statement of Profit or Loss
  incomeStatement: {
    revenue: {
      ticketSales: number;
      bottleService: number;
      advertising: number;
      partnerships: number;
      other: number;
    };
    costOfSales: number;
    grossProfit: number;
    operatingExpenses: number;
    ebitda: number;
    depreciation: number;
    amortization: number;
    ebit: number;
    interest: number;
    tax: number;
    netIncome: number;
  };
  // Statement of Cash Flows
  cashFlow: {
    operating: number;
    investing: number;
    financing: number;
    netChange: number;
    openingBalance: number;
    closingBalance: number;
  };
}

/**
 * Convert amount between currencies
 */
export function convertCurrency(
  amount: number,
  from: keyof typeof IFRS_CONFIG.currencies,
  to: keyof typeof IFRS_CONFIG.currencies
): number {
  if (from === to) return amount;
  
  const rateKey = `${from}-${to}` as keyof typeof IFRS_CONFIG.exchangeRates;
  const rate = IFRS_CONFIG.exchangeRates[rateKey];
  
  if (!rate) {
    // Convert through USD as base
    const toUSD = from === 'USD' ? amount : amount * (IFRS_CONFIG.exchangeRates[`${from}-USD` as keyof typeof IFRS_CONFIG.exchangeRates] || 0);
    return to === 'USD' ? toUSD : toUSD / (IFRS_CONFIG.exchangeRates[`${to}-USD` as keyof typeof IFRS_CONFIG.exchangeRates] || 1);
  }
  
  return amount * rate;
}

/**
 * Format amount for display
 */
export function formatCurrency(
  amount: number,
  currency: keyof typeof IFRS_CONFIG.currencies
): string {
  const config = IFRS_CONFIG.currencies[currency];
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(amount);
}

/**
 * Generate IFRS-compliant Balance Sheet
 */
export function generateBalanceSheet(data: {
  cash: number;
  receivables: number;
  prepayments: number;
  property: number;
  equipment: number;
  intangible: number;
  payables: number;
  accruals: number;
  deferredRevenue: number;
  loans: number;
  shareCapital: number;
  retainedEarnings: number;
  otherReserves: number;
  currency: keyof typeof IFRS_CONFIG.currencies;
}): FinancialStatement['balanceSheet'] {
  return {
    assets: {
      current: {
        cash: data.cash,
        receivables: data.receivables,
        prepayments: data.prepayments,
        inventory: 0,
      },
      nonCurrent: {
        property: 0,
        equipment: data.equipment,
        intangible: data.intangible,
        investments: 0,
      },
    },
    liabilities: {
      current: {
        payables: data.payables,
        accruals: data.accruals,
        deferredRevenue: data.deferredRevenue,
        loans: 0,
      },
      nonCurrent: {
        loans: data.loans,
        leases: 0,
      },
    },
    equity: {
      shareCapital: data.shareCapital,
      retainedEarnings: data.retainedEarnings,
      otherReserves: data.otherReserves,
    },
  };
}

/**
 * Generate IFRS-compliant Income Statement
 */
export function generateIncomeStatement(data: {
  ticketSales: number;
  bottleService: number;
  advertising: number;
  partnerships: number;
  otherRevenue: number;
  cogs: number;
  opex: number;
  depreciation: number;
  amortization: number;
  interest: number;
  taxRate: number;
}): FinancialStatement['incomeStatement'] {
  const revenue = data.ticketSales + data.bottleService + data.advertising + data.partnerships + data.otherRevenue;
  const grossProfit = revenue - data.cogs;
  const ebitda = grossProfit - data.opex;
  const ebit = ebitda - data.depreciation - data.amortization;
  const tax = Math.max(0, ebit) * data.taxRate;
  const netIncome = ebit - data.interest - tax;
  
  return {
    revenue: {
      ticketSales: data.ticketSales,
      bottleService: data.bottleService,
      advertising: data.advertising,
      partnerships: data.partnerships,
      other: data.otherRevenue,
    },
    costOfSales: data.cogs,
    grossProfit,
    operatingExpenses: data.opex,
    ebitda,
    depreciation: data.depreciation,
    amortization: data.amortization,
    ebit,
    interest: data.interest,
    tax,
    netIncome,
  };
}

/**
 * Translate financial statement to reporting currency
 */
export function translateToReportingCurrency(
  statement: FinancialStatement,
  targetCurrency: keyof typeof IFRS_CONFIG.currencies
): FinancialStatement {
  const rate = convertCurrency(1, statement.currency as any, targetCurrency);
  
  // Deep clone and translate all numeric values
  const translate = (obj: any): any => {
    if (typeof obj === 'number') return obj * rate;
    if (Array.isArray(obj)) return obj.map(translate);
    if (typeof obj === 'object' && obj !== null) {
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, translate(v)])
      );
    }
    return obj;
  };
  
  return {
    ...translate(statement),
    currency: targetCurrency,
    exchangeRate: rate,
  };
}

/**
 * Calculate EBITDA Margin
 */
export function calculateEBITDAMargin(ebitda: number, revenue: number): number {
  return (ebitda / revenue) * 100;
}

/**
 * Calculate Net Profit Margin
 */
export function calculateNetProfitMargin(netIncome: number, revenue: number): number {
  return (netIncome / revenue) * 100;
}

/**
 * Calculate Current Ratio (Liquidity)
 */
export function calculateCurrentRatio(
  currentAssets: number,
  currentLiabilities: number
): number {
  return currentAssets / currentLiabilities;
}

/**
 * Calculate Debt-to-Equity Ratio (Leverage)
 */
export function calculateDebtToEquity(
  totalDebt: number,
  totalEquity: number
): number {
  return totalDebt / totalEquity;
}

/**
 * Calculate Return on Equity (ROE)
 */
export function calculateROE(
  netIncome: number,
  averageEquity: number
): number {
  return (netIncome / averageEquity) * 100;
}

/**
 * Generate complete IFRS financial statement
 */
export function generateIFRSStatement(data: {
  revenue: number;
  cogs: number;
  opex: number;
  depreciation: number;
  amortization: number;
  interest: number;
  taxRate: number;
  assets: {
    cash: number;
    receivables: number;
    prepayments: number;
    equipment: number;
    intangible: number;
  };
  liabilities: {
    payables: number;
    accruals: number;
    deferredRevenue: number;
    loans: number;
  };
  equity: {
    shareCapital: number;
    retainedEarnings: number;
    otherReserves: number;
  };
  cashFlow: {
    operating: number;
    investing: number;
    financing: number;
  };
}): FinancialStatement {
  const incomeStatement = generateIncomeStatement({
    ticketSales: data.revenue * 0.4,
    bottleService: data.revenue * 0.35,
    advertising: data.revenue * 0.15,
    partnerships: data.revenue * 0.08,
    otherRevenue: data.revenue * 0.02,
    cogs: data.cogs,
    opex: data.opex,
    depreciation: data.depreciation,
    amortization: data.amortization,
    interest: data.interest,
    taxRate: data.taxRate,
  });
  
  const balanceSheet = generateBalanceSheet({
    ...data.assets,
    ...data.liabilities,
    ...data.equity,
    property: 0,
    investments: 0,
    inventory: 0,
    current: data.assets.cash + data.assets.receivables,
    currency: 'IDR',
  } as any);
  
  const cashFlowOperating = data.cashFlow.operating;
  const cashFlowInvesting = data.cashFlow.investing;
  const cashFlowFinancing = data.cashFlow.financing;
  const netCashChange = cashFlowOperating + cashFlowInvesting + cashFlowFinancing;
  
  return {
    period: new Date().toISOString().slice(0, 7),
    currency: 'IDR',
    exchangeRate: 1,
    balanceSheet,
    incomeStatement,
    cashFlow: {
      operating: cashFlowOperating,
      investing: cashFlowInvesting,
      financing: cashFlowFinancing,
      netChange: netCashChange,
      openingBalance: data.assets.cash - netCashChange,
      closingBalance: data.assets.cash,
    },
  };
}
