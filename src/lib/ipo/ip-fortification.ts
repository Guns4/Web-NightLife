/**
 * INTELLECTUAL PROPERTY FORTIFICATION
 * Phase 9: Strategic Exit & IPO Preparation
 * 
 * Features:
 * - Patent filing module
 * - Trademark management
 * - Legal tech vault
 * - Contract management
 */

export const IP_CONFIG = {
  // Patent categories
  patents: {
    nfcVerification: {
      id: 'nfc_mint',
      name: 'NFC-to-Mint Vibe Verification',
      description: 'System and method for verifying user presence using NFC and minting digital assets',
      status: 'filed',
      filingDate: '2024-01-15',
      jurisdiction: 'Indonesia',
      priority: 'high',
    },
    crowdForecasting: {
      id: 'crowd_forecast',
      name: 'Predictive Crowd Forecasting',
      description: 'AI-based system for predicting venue crowd levels using historical and real-time data',
      status: 'filed',
      filingDate: '2024-02-01',
      jurisdiction: 'Indonesia',
      priority: 'high',
    },
    vibeMatching: {
      id: 'vibe_match',
      name: 'Vibe Matching Algorithm',
      description: 'Method for matching users with venues based on music preferences and social graphs',
      status: 'pending',
      priority: 'medium',
    },
    dynamicPricing: {
      id: 'dynamic_price',
      name: 'Dynamic Pricing for Events',
      description: 'Real-time pricing optimization for event tickets based on demand prediction',
      status: 'pending',
      priority: 'medium',
    },
  },
  
  // Trademarks
  trademarks: {
    primary: {
      name: 'NightLife',
      logo: 'https://nightlife.id/logo.png',
      registration: 'IDM000123456',
      classes: [41, 35, 9], // Entertainment, Advertising, App
      status: 'registered',
      expiry: '2034-01-01',
    },
    secondary: [
      { name: 'VIBE', status: 'registered', classes: [36] },
      { name: 'NightLife Pro', status: 'filed', classes: [41] },
      { name: 'ClubCard', status: 'registered', classes: [35] },
    ],
  },
  
  // Legal categories
  legal: {
    contracts: {
      venueAgreements: {
        category: 'Venue Partnership',
        count: 150,
        expiryAlert: 30, // days before expiry
      },
      brandPartnerships: {
        category: 'Brand Partnership',
        count: 25,
        expiryAlert: 60,
      },
      vendorContracts: {
        category: 'Vendor',
        count: 50,
        expiryAlert: 14,
      },
      employmentContracts: {
        category: 'Employment',
        count: 200,
        expiryAlert: 30,
      },
    },
    licenses: {
      musicLicensing: {
        type: 'Music Rights',
        provider: 'KOMPAS',
        expiry: '2025-12-31',
        autoRenew: true,
      },
      softwareLicenses: {
        type: 'Software',
        count: 15,
        expiryAlert: 30,
      },
    },
  },
  
  // Protection measures
  protection: {
    copyright: true,
    tradeSecret: true,
    ndaRequired: ['employees', 'contractors', 'partners'],
    auditFrequency: 'quarterly',
  },
};

export interface Patent {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'filed' | 'examined' | 'granted' | 'rejected';
  filingDate?: Date;
  grantDate?: Date;
  jurisdiction: string;
  priority: 'low' | 'medium' | 'high';
  attorney: string;
  costs: {
    filing: number;
    examination: number;
    maintenance: number;
  };
}

export interface Trademark {
  id: string;
  name: string;
  logo?: string;
  registration?: string;
  classes: number[];
  status: 'pending' | 'filed' | 'registered' | 'opposed';
  filingDate?: Date;
  registrationDate?: Date;
  expiryDate?: Date;
}

export interface LegalContract {
  id: string;
  title: string;
  type: string;
  counterparty: string;
  value?: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expiring' | 'expired' | 'terminated';
  autoRenew: boolean;
  renewalTerms?: string;
  attachments: string[];
}

export interface IPAsset {
  id: string;
  type: 'patent' | 'trademark' | 'copyright' | 'trade_secret';
  name: string;
  status: 'protected' | 'pending' | 'expired';
  jurisdiction: string;
  value: number;
  renewalDate?: Date;
  documents: string[];
}

/**
 * Generate patent filing data
 */
export function generatePatentFiling(patent: {
  name: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}): Patent {
  const costs = {
    low: { filing: 5000, examination: 3000, maintenance: 2000 },
    medium: { filing: 10000, examination: 6000, maintenance: 4000 },
    high: { filing: 20000, examination: 12000, maintenance: 8000 },
  };
  
  return {
    id: `PAT-${Date.now()}`,
    name: patent.name,
    description: patent.description,
    status: 'pending',
    jurisdiction: 'Indonesia',
    priority: patent.priority,
    attorney: 'IP Law Firm',
    costs: costs[patent.priority],
  };
}

/**
 * Calculate IP portfolio value
 */
export function calculateIPValue(assets: IPAsset[]): {
  total: number;
  byType: Record<string, number>;
  atRisk: number;
} {
  const byType: Record<string, number> = {};
  let atRisk = 0;
  
  for (const asset of assets) {
    byType[asset.type] = (byType[asset.type] || 0) + asset.value;
    
    if (asset.renewalDate) {
      const daysUntilRenewal = (asset.renewalDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysUntilRenewal < 30) atRisk += asset.value;
    }
  }
  
  return {
    total: assets.reduce((sum, a) => sum + a.value, 0),
    byType,
    atRisk,
  };
}

/**
 * Check contract expirations
 */
export function checkContractExpirations(
  contracts: LegalContract[],
  alertDays: number = 30
): {
  expiring: LegalContract[];
  expired: LegalContract[];
  actionRequired: LegalContract[];
} {
  const now = Date.now();
  const alertMs = alertDays * 24 * 60 * 60 * 1000;
  
  const expiring: LegalContract[] = [];
  const expired: LegalContract[] = [];
  const actionRequired: LegalContract[] = [];
  
  for (const contract of contracts) {
    const daysUntilExpiry = (contract.endDate.getTime() - now) / (1000 * 60 * 60 * 24);
    
    if (daysUntilExpiry < 0) {
      expired.push(contract);
    } else if (daysUntilExpiry < alertDays) {
      expiring.push(contract);
      if (!contract.autoRenew) {
        actionRequired.push(contract);
      }
    }
  }
  
  return { expiring, expired, actionRequired };
}

/**
 * Get IP protection status
 */
export function getIPProtectionStatus(): {
  patents: { total: number; protected: number; pending: number };
  trademarks: { total: number; protected: number; pending: number };
  contracts: { total: number; active: number; expiring: number };
  compliance: { score: number; issues: string[] };
} {
  return {
    patents: {
      total: 4,
      protected: 2,
      pending: 2,
    },
    trademarks: {
      total: 4,
      protected: 3,
      pending: 1,
    },
    contracts: {
      total: 425,
      active: 380,
      expiring: 15,
    },
    compliance: {
      score: 92,
      issues: ['2 patents need renewal', '3 contracts expiring in 30 days'],
    },
  };
}
