/**
 * FRANCHISE-IN-A-BOX
 * Phase 10: The Global Vibe Protocol & Metaverse
 * 
 * Features:
 * - Regional Master Dashboard
 * - Auto-localization
 * - Global license fees
 */

export const FRANCHISE_CONFIG = {
  // Supported regions
  regions: {
    id: {
      name: 'Indonesia',
      code: 'ID',
      currency: 'IDR',
      locale: 'id-ID',
      timezone: 'Asia/Jakarta',
      tax: { vat: 0.11, service: 0.1 },
      legal: 'UU PDP',
    },
    th: {
      name: 'Thailand',
      code: 'TH',
      currency: 'THB',
      locale: 'th-TH',
      timezone: 'Asia/Bangkok',
      tax: { vat: 0.07, service: 0.1 },
      legal: 'PDPA',
    },
    sg: {
      name: 'Singapore',
      code: 'SG',
      currency: 'SGD',
      locale: 'en-SG',
      timezone: 'Asia/Singapore',
      tax: { vat: 0.09, service: 0.1 },
      legal: 'PDPA',
    },
    my: {
      name: 'Malaysia',
      code: 'MY',
      currency: 'MYR',
      locale: 'ms-MY',
      timezone: 'Asia/Kuala_Lumpur',
      tax: { vat: 0.06, service: 0.1 },
      legal: 'PDPA',
    },
    jp: {
      name: 'Japan',
      code: 'JP',
      currency: 'JPY',
      locale: 'ja-JP',
      timezone: 'Asia/Tokyo',
      tax: { vat: 0.10, service: 0 },
      legal: 'APPI',
    },
    us: {
      name: 'United States',
      code: 'US',
      currency: 'USD',
      locale: 'en-US',
      timezone: 'America/New_York',
      tax: { vat: 0, sales: 0.08 },
      legal: 'CCPA',
    },
  },
  
  // License fees
  license: {
    master: {
      annualFee: 1000000, // USD
      revenueShare: 0.05, // 5%
    },
    regional: {
      annualFee: 100000, // USD
      revenueShare: 0.08, // 8%
    },
  },
  
  // Localization
  autoLocalization: {
    languages: ['en', 'id', 'th', 'ms', 'ja', 'zh'],
    features: [
      'language',
      'currency',
      'payment_methods',
      'tax_compliance',
      'legal_compliance',
      'marketing',
    ],
  },
};

export interface RegionalConfig {
  region: string;
  countryCode: string;
  name: string;
  currency: string;
  locale: string;
  timezone: string;
  tax: {
    vat: number;
    service?: number;
    sales?: number;
  };
  legal: string;
  features: string[];
  licenseFee: number;
  revenueShare: number;
}

export interface FranchiseInstance {
  id: string;
  name: string;
  region: string;
  countryCode: string;
  status: 'pending' | 'active' | 'suspended' | 'closed';
  config: RegionalConfig;
  launchedAt: Date;
  metrics: {
    venues: number;
    users: number;
    revenue: number;
  };
}

/**
 * Get regional configuration
 */
export function getRegionalConfig(region: string): RegionalConfig {
  const regionData = FRANCHISE_CONFIG.regions[region as keyof typeof FRANCHISE_CONFIG.regions];
  const isMaster = region === 'id'; // Indonesia as master
  
  return {
    region,
    countryCode: regionData.code,
    name: regionData.name,
    currency: regionData.currency,
    locale: regionData.locale,
    timezone: regionData.timezone,
    tax: regionData.tax,
    legal: regionData.legal,
    features: FRANCHISE_CONFIG.autoLocalization.features,
    licenseFee: isMaster ? FRANCHISE_CONFIG.license.master.annualFee : FRANCHISE_CONFIG.license.regional.annualFee,
    revenueShare: isMaster ? FRANCHISE_CONFIG.license.master.revenueShare : FRANCHISE_CONFIG.license.regional.revenueShare,
  };
}

/**
 * Create new franchise instance
 */
export function createFranchise(
  name: string,
  region: string
): FranchiseInstance {
  const config = getRegionalConfig(region);
  
  return {
    id: `FRAN-${Date.now()}`,
    name,
    region,
    countryCode: config.countryCode,
    status: 'pending',
    config,
    launchedAt: new Date(),
    metrics: {
      venues: 0,
      users: 0,
      revenue: 0,
    },
  };
}

/**
 * Calculate global license fee
 */
export function calculateLicenseFee(
  region: string,
  revenue: number
): {
  annualFee: number;
  revenueShare: number;
  total: number;
} {
  const config = getRegionalConfig(region);
  const annualFee = config.licenseFee;
  const revenueShare = revenue * config.revenueShare;
  
  return {
    annualFee,
    revenueShare,
    total: annualFee + revenueShare,
  };
}
