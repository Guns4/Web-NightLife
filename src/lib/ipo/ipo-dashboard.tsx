/**
 * IPO DASHBOARD
 * Phase 9: Strategic Exit & IPO Preparation
 * 
 * Features:
 * - Public Market Readiness
 * - ESG Impact Metrics
 * - Jobs Created
 * - Tourism GDP Contribution
 */

export const IPO_CONFIG = {
  // Stock exchange targets
  exchanges: {
    idx: {
      name: 'Indonesia Stock Exchange (IDX)',
      symbol: 'NIGHTLIFE',
      currency: 'IDR',
      minMarketCap: 1000000000000, // 1 Trillion IDR
      requirements: [
        '3 years of positive earnings',
        'Minimum 200 shareholders',
        'Public float > 20%',
        'Clean audit reports',
      ],
    },
    nasdaq: {
      name: 'NASDAQ',
      symbol: 'NVIB',
      currency: 'USD',
      minMarketCap: 75000000, // $75M
      requirements: [
        'Minimum bid price $4',
        '3.5M+ public float',
        '300+ round lot shareholders',
        'Market makers: 2',
      ],
    },
  },
  
  // ESG Metrics
  esg: {
    environmental: {
      metrics: [
        'Carbon emissions per user',
        'Renewable energy usage',
        'Waste reduction',
      ],
      targets: {
        carbonNeutral: '2030',
        renewableEnergy: '80% by 2028',
      },
    },
    social: {
      metrics: [
        'Jobs created',
        'Diversity & inclusion',
        'Community impact',
        'Supplier ethics',
      ],
      targets: {
        genderParity: '50% by 2026',
        localHiring: '80% local workforce',
      },
    },
    governance: {
      metrics: [
        'Board diversity',
        'Executive pay ratio',
        'Shareholder rights',
        'Transparency score',
      ],
      targets: {
        independentBoard: '50%+ independent',
        auditRotation: '5 years max',
      },
    },
  },
  
  // Impact metrics
  impact: {
    jobsCreated: {
      direct: {
        employees: 250,
        contractors: 500,
      },
      indirect: {
        venues: 5000,
        suppliers: 1000,
      },
      total: 6750,
    },
    tourismGDP: {
      annualContribution: 500000000000, // 500 Billion IDR
      percentageOfNational: 0.05, // 0.05%
      growthRate: 0.15,
    },
    economicImpact: {
      userSpending: 2000000000000, // 2 Trillion IDR annually
      vendorPayments: 800000000000,
      taxContribution: 150000000000,
    },
  },
};

export interface IPOReadiness {
  overall: number;
  financials: number;
  governance: number;
  operations: number;
  esg: number;
}

export interface ESGMetrics {
  environmental: {
    carbonFootprint: number;
    renewableEnergyPercent: number;
    wasteReduced: number;
  };
  social: {
    totalJobs: number;
    diversityScore: number;
    communityInvestment: number;
  };
  governance: {
    boardIndependence: number;
    transparencyScore: number;
    auditQuality: number;
  };
}

export interface ImpactReport {
  period: string;
  jobsCreated: {
    direct: { employees: number; contractors: number };
    indirect: { venues: number; suppliers: number };
    total: number;
  };
  tourismContribution: {
    revenue: number;
    percentageOfGDP: number;
  };
  economicImpact: {
    userSpending: number;
    vendorPayments: number;
    taxContribution: number;
  };
}

/**
 * Calculate IPO Readiness Score
 */
export function calculateIPOReadiness(data: {
  financials: number;
  governance: number;
  operations: number;
  esg: number;
}): IPOReadiness {
  const weights = {
    financials: 0.40,
    governance: 0.25,
    operations: 0.20,
    esg: 0.15,
  };
  
  const overall = 
    data.financials * weights.financials +
    data.governance * weights.governance +
    data.operations * weights.operations +
    data.esg * weights.esg;
  
  return {
    overall: Math.round(overall),
    financials: data.financials,
    governance: data.governance,
    operations: data.operations,
    esg: data.esg,
  };
}

/**
 * Get impact report
 */
export function getImpactReport(): ImpactReport {
  return {
    period: new Date().toISOString().slice(0, 7),
    jobsCreated: IPO_CONFIG.impact.jobsCreated,
    tourismContribution: {
      revenue: IPO_CONFIG.impact.tourismGDP.annualContribution,
      percentageOfGDP: IPO_CONFIG.impact.tourismGDP.percentageOfNational,
    },
    economicImpact: IPO_CONFIG.impact.economicImpact,
  };
}

/**
 * Get ESG metrics
 */
export function getESGMetrics(): ESGMetrics {
  return {
    environmental: {
      carbonFootprint: 1250, // tons CO2
      renewableEnergyPercent: 45,
      wasteReduced: 30, // percentage
    },
    social: {
      totalJobs: IPO_CONFIG.impact.jobsCreated.total,
      diversityScore: 72, // percentage
      communityInvestment: 5000000000, // IDR
    },
    governance: {
      boardIndependence: 60,
      transparencyScore: 85,
      auditQuality: 95,
    },
  };
}

/**
 * Get exchange requirements
 */
export function getExchangeRequirements(exchange: 'idx' | 'nasdaq') {
  return IPO_CONFIG.exchanges[exchange];
}

/**
 * Calculate valuation
 */
export function calculateValuation(revenue: number, multiple: number = 10): {
  revenue: number;
  ebitda: number;
  multiple: number;
  valuation: number;
  perShare: number;
} {
  const ebitda = revenue * 0.15; // Assume 15% EBITDA margin
  const valuation = ebitda * multiple;
  
  return {
    revenue,
    ebitda,
    multiple,
    valuation,
    perShare: valuation / 1000000, // Assuming 1M shares
  };
}
