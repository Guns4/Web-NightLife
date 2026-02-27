/**
 * M&A DATA ROOM - INVESTOR PORTAL
 * Phase 9: Strategic Exit & IPO Preparation
 * 
 * Features:
 * - Unit economics visualization (LTV vs CAC)
 * - Cohort retention analysis
 * - EBITDA projections
 * - Real-time investor reporting
 */

export const DATA_ROOM_CONFIG = {
  // Metrics
  metrics: {
    ltv: {
      name: 'Lifetime Value',
      description: 'Total revenue expected from a customer over their entire relationship',
      formula: 'Average Transaction Value × Transactions per Year × Average Customer Lifespan',
      benchmark: {
        good: 150,
        excellent: 300,
      },
    },
    cac: {
      name: 'Customer Acquisition Cost',
      description: 'Total cost of acquiring a new customer',
      formula: 'Total Marketing Spend / Number of New Customers',
      benchmark: {
        good: 50,
        excellent: 25,
      },
    },
    ltvCacRatio: {
      name: 'LTV:CAC Ratio',
      description: 'Efficiency of customer acquisition',
      formula: 'LTV / CAC',
      benchmark: {
        good: 3,
        excellent: 5,
      },
    },
    paybackPeriod: {
      name: 'Payback Period',
      description: 'Time to recover CAC from customer revenue',
      formula: 'CAC / Monthly Revenue per Customer',
      benchmark: {
        good: 12,
        excellent: 6,
      },
    },
    churnRate: {
      name: 'Monthly Churn Rate',
      description: 'Percentage of customers lost per month',
      formula: 'Customers Lost / Total Customers at Start',
      benchmark: {
        good: 0.05,
        excellent: 0.02,
      },
    },
    retentionRate: {
      name: 'Retention Rate',
      description: 'Percentage of customers retained',
      formula: '1 - Churn Rate',
      benchmark: {
        good: 0.95,
        excellent: 0.98,
      },
    },
    cohortLtv: {
      name: 'Cohort LTV',
      description: 'LTV calculated by customer cohort (month of acquisition)',
    },
    paybackPeriodMonths: {
      name: 'Payback Period (Months)',
      description: 'Months to recover CAC',
    },
  },
  
  // Cohorts
  cohorts: {
    monthly: true,
    quarterly: true,
    yearly: false,
    maxAge: 24, // Track up to 24 months
  },
  
  // EBITDA Categories
  ebitda: {
    revenue: {
      ticketSales: 'Ticket & Cover Charges',
      bottleService: 'Bottle Service',
      tableReservations: 'Table Reservations',
      vipMembership: 'VIP Memberships',
      advertising: 'Advertising',
      partnerships: 'Brand Partnerships',
    },
    cogs: {
      entertainment: 'Entertainment & DJ Costs',
      staffing: 'Staffing & Labor',
      venueCosts: 'Venue Rent & Utilities',
      marketing: 'Marketing & Promotions',
      technology: 'Technology & Platform',
      operations: 'Operations & Supplies',
    },
    opex: {
      salaries: 'Salaries & Benefits',
      rent: 'Office Rent',
      legal: 'Legal & Professional',
      insurance: 'Insurance',
      software: 'Software & Subscriptions',
      travel: 'Travel & Entertainment',
    },
  },
  
  // Investor Report Sections
  reportSections: {
    executiveSummary: {
      keyMetrics: ['revenue', 'users', 'gmv', 'ebitda'],
      growth: ['revenueGrowth', 'userGrowth', 'gmvGrowth'],
    },
    unitEconomics: {
      metrics: ['ltv', 'cac', 'ltvCacRatio', 'paybackPeriod'],
      cohortAnalysis: true,
    },
    financialStatements: {
      incomeStatement: true,
      balanceSheet: true,
      cashFlow: true,
    },
    marketAnalysis: {
      tam: true,
      sam: true,
      som: true,
      competitiveLandscape: true,
    },
    projections: {
      revenue: '3-year forecast',
      ebitda: '3-year forecast',
      users: '3-year forecast',
    },
  },
  
  // Access Levels
  accessLevels: {
    public: ['companyOverview', 'pressReleases'],
    investor: ['keyMetrics', 'unitEconomics', 'financials'],
    vip: ['fullDataRoom', 'boardPresentations', 'dueDiligence'],
  },
};

export interface UnitEconomics {
  ltv: number;
  cac: number;
  ltvCacRatio: number;
  paybackPeriod: number;
  churnRate: number;
  retentionRate: number;
  averageOrderValue: number;
  transactionsPerMonth: number;
  customerLifespan: number;
}

export interface CohortData {
  cohort: string; // e.g., "2024-01"
  totalCustomers: number;
  revenueByMonth: number[];
  retentionByMonth: number[];
  ltv: number;
  cac: number;
}

export interface EBITDAProjection {
  period: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  opex: number;
  ebitda: number;
  ebitdaMargin: number;
}

export interface InvestorReport {
  id: string;
  type: 'monthly' | 'quarterly' | 'annual';
  period: string;
  generatedAt: Date;
  sections: {
    executiveSummary: any;
    unitEconomics: UnitEconomics;
    cohortAnalysis: CohortData[];
    financials: {
      income: any;
      balance: any;
      cashflow: any;
    };
    projections: EBITDAProjection[];
  };
}

/**
 * Calculate Unit Economics
 */
export function calculateUnitEconomics(data: {
  avgTransactionValue: number;
  transactionsPerYear: number;
  customerLifespan: number;
  marketingSpend: number;
  newCustomers: number;
  monthlyChurnRate: number;
}): UnitEconomics {
  const ltv = data.avgTransactionValue * data.transactionsPerYear * data.customerLifespan;
  const cac = data.marketingSpend / data.newCustomers;
  const ltvCacRatio = ltv / cac;
  const monthlyRevenue = data.avgTransactionValue * (data.transactionsPerYear / 12);
  const paybackPeriod = cac / monthlyRevenue;
  
  return {
    ltv: Math.round(ltv * 100) / 100,
    cac: Math.round(cac * 100) / 100,
    ltvCacRatio: Math.round(ltvCacRatio * 100) / 100,
    paybackPeriod: Math.round(paybackPeriod * 10) / 10,
    churnRate: data.monthlyChurnRate,
    retentionRate: Math.round((1 - data.monthlyChurnRate) * 10000) / 10000,
    averageOrderValue: data.avgTransactionValue,
    transactionsPerMonth: Math.round(data.transactionsPerYear / 12),
    customerLifespan: data.customerLifespan,
  };
}

/**
 * Calculate Cohort LTV
 */
export function calculateCohortLTV(
  cohort: string,
  initialCustomers: number,
  monthlyRevenue: number[],
  monthlyRetention: number[]
): CohortData {
  const ltv = monthlyRevenue.reduce((sum, rev) => sum + rev, 0);
  const avgRetention = monthlyRetention.reduce((sum, r) => sum + r, 0) / monthlyRetention.length;
  
  return {
    cohort,
    totalCustomers: initialCustomers,
    revenueByMonth: monthlyRevenue,
    retentionByMonth: monthlyRetention,
    ltv: Math.round(ltv * 100) / 100,
    cac: 0, // Would need actual CAC data
  };
}

/**
 * Calculate EBITDA
 */
export function calculateEBITDA(
  revenue: number,
  cogs: number,
  opex: number
): {
  grossProfit: number;
  grossMargin: number;
  ebitda: number;
  ebitdaMargin: number;
} {
  const grossProfit = revenue - cogs;
  const grossMargin = (grossProfit / revenue) * 100;
  const ebitda = grossProfit - opex;
  const ebitdaMargin = (ebitda / revenue) * 100;
  
  return {
    grossProfit,
    grossMargin: Math.round(grossMargin * 100) / 100,
    ebitda,
    ebitdaMargin: Math.round(ebitdaMargin * 100) / 100,
  };
}

/**
 * Generate Investor Report
 */
export function generateInvestorReport(
  type: 'monthly' | 'quarterly' | 'annual',
  data: {
    unitEconomics: UnitEconomics;
    cohorts: CohortData[];
    financials: any;
    projections: EBITDAProjection[];
  }
): InvestorReport {
  return {
    id: `RPT-${Date.now()}`,
    type,
    period: new Date().toISOString().slice(0, 7),
    generatedAt: new Date(),
    sections: {
      executiveSummary: {
        keyMetrics: data.financials.keyMetrics,
        growth: data.financials.growth,
      },
      unitEconomics: data.unitEconomics,
      cohortAnalysis: data.cohorts,
      financials: data.financials,
      projections: data.projections,
    },
  };
}

/**
 * Calculate LTV:CAC Score
 */
export function getLtvCacScore(ratio: number): {
  score: 'excellent' | 'good' | 'needs_improvement';
  color: string;
  message: string;
} {
  if (ratio >= DATA_ROOM_CONFIG.metrics.ltvCacRatio.benchmark.excellent) {
    return {
      score: 'excellent',
      color: '#10B981', // green
      message: 'Excellent unit economics - highly scalable business',
    };
  }
  if (ratio >= DATA_ROOM_CONFIG.metrics.ltvCacRatio.benchmark.good) {
    return {
      score: 'good',
      color: '#F59E0B', // yellow
      message: 'Good unit economics - room for optimization',
    };
  }
  return {
    score: 'needs_improvement',
    color: '#EF4444', // red
    message: 'Unit economics need improvement before scaling',
  };
}
