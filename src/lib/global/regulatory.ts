/**
 * GLOBAL REGULATORY ORACLE
 * Phase 10.1: Jurisdiction Adaptation Engine
 * 
 * Features:
 * - Auto-detect local laws for alcohol, operating hours, taxes
 * - PB1 in Indonesia, VAT in UK, Sales Tax in US
 * - Legal terms and financial split auto-configuration
 */

import { createClient } from '@supabase/supabase-js';

// Country/Region codes
export type CountryCode = 
  | 'ID'  // Indonesia
  | 'US'  // United States
  | 'GB'  // United Kingdom
  | 'TH'  // Thailand
  | 'SG'  // Singapore
  | 'MY'  // Malaysia
  | 'AU'  // Australia
  | 'JP'  // Japan
  | 'KR'  // South Korea
  | 'AE'  // UAE
  | 'DE'  // Germany
  | 'FR'  // France
  | 'ES'  // Spain
  | 'IT'  // Italy
  | 'NL'  // Netherlands
  | 'XX'; // Default/Unknown

// Jurisdiction configuration per country
export const JURISDICTION_CONFIG: Record<CountryCode, {
  name: string;
  alcoholLaws: {
    legalAge: number;
    restrictions: string[];
    bannedTypes?: string[];
  };
  operatingHours: {
    defaultOpen: string;
    defaultClose: string;
    weekendExtended?: boolean;
    holidaysRestricted: boolean;
  };
  taxes: {
    name: string;
    rate: number; // percentage
    included: boolean; // true = tax included in price
    additional?: { name: string; rate: number }[];
  };
  licensing: {
    required: boolean;
    types: string[];
    renewalPeriod: number; // days
  };
  dataPrivacy: {
    law: string;
    consentRequired: boolean;
    dataRetention: number; // days
  };
}> = {
  ID: {
    name: 'Indonesia',
    alcoholLaws: {
      legalAge: 21,
      restrictions: ['No sales during Ramadan', 'Restricted near religious buildings'],
      bannedTypes: ['Certain local arak'],
    },
    operatingHours: {
      defaultOpen: '18:00',
      defaultClose: '02:00',
      weekendExtended: true,
      holidaysRestricted: true,
    },
    taxes: {
      name: 'PPN (VAT)',
      rate: 11,
      included: false,
      additional: [{ name: 'PB1', rate: 10 }], // Local alcohol tax
    },
    licensing: {
      required: true,
      types: ['Izin Tempat Penjualan Minuman Beralkohol'],
      renewalPeriod: 365,
    },
    dataPrivacy: {
      law: 'UU PDP',
      consentRequired: true,
      dataRetention: 2190, // 6 years
    },
  },
  US: {
    name: 'United States',
    alcoholLaws: {
      legalAge: 21,
      restrictions: ['State-specific laws', 'Last call times vary by state'],
    },
    operatingHours: {
      defaultOpen: '10:00',
      defaultClose: '02:00',
      weekendExtended: true,
      holidaysRestricted: false,
    },
    taxes: {
      name: 'Sales Tax',
      rate: 8.875, // NYC example
      included: false,
      additional: [
        { name: 'State Tax', rate: 4 },
        { name: 'City Tax', rate: 4.875 },
      ],
    },
    licensing: {
      required: true,
      types: ['Liquor License'],
      renewalPeriod: 365,
    },
    dataPrivacy: {
      law: 'CCPA/CPRA',
      consentRequired: true,
      dataRetention: 1095, // 3 years
    },
  },
  GB: {
    name: 'United Kingdom',
    alcoholLaws: {
      legalAge: 18,
      restrictions: ['Challenge 25 policy', 'No serving to intoxicated'],
    },
    operatingHours: {
      defaultOpen: '11:00',
      defaultClose: '23:00',
      weekendExtended: true,
      holidaysRestricted: false,
    },
    taxes: {
      name: 'VAT',
      rate: 20,
      included: true,
    },
    licensing: {
      required: true,
      types: ['Premises License'],
      renewalPeriod: 365,
    },
    dataPrivacy: {
      law: 'UK GDPR',
      consentRequired: true,
      dataRetention: 1095,
    },
  },
  TH: {
    name: 'Thailand',
    alcoholLaws: {
      legalAge: 20,
      restrictions: ['No sales during elections', 'Restricted religious holidays'],
    },
    operatingHours: {
      defaultOpen: '11:00',
      defaultClose: '01:00',
      holidaysRestricted: true,
    },
    taxes: {
      name: 'VAT',
      rate: 7,
      included: false,
    },
    licensing: {
      required: true,
      types: ['Alcohol License'],
      renewalPeriod: 365,
    },
    dataPrivacy: {
      law: 'PDPA',
      consentRequired: true,
      dataRetention: 730,
    },
  },
  SG: {
    name: 'Singapore',
    alcoholLaws: {
      legalAge: 18,
      restrictions: ['No public consumption after 10:30pm in certain areas'],
    },
    operatingHours: {
      defaultOpen: '10:00',
      defaultClose: '01:00',
      holidaysRestricted: false,
    },
    taxes: {
      name: 'GST',
      rate: 9,
      included: false,
    },
    licensing: {
      required: true,
      types: ['Liquor License'],
      renewalPeriod: 365,
    },
    dataPrivacy: {
      law: 'PDPA',
      consentRequired: true,
      dataRetention: 1095,
    },
  },
  MY: {
    name: 'Malaysia',
    alcoholLaws: {
      legalAge: 21,
      restrictions: ['Non-Muslims only', 'No sale during Ramadan'],
    },
    operatingHours: {
      defaultOpen: '12:00',
      defaultClose: '01:00',
      holidaysRestricted: true,
    },
    taxes: {
      name: 'SST',
      rate: 6,
      included: false,
    },
    licensing: {
      required: true,
      types: ['Liquor License'],
      renewalPeriod: 365,
    },
    dataPrivacy: {
      law: 'PDPA',
      consentRequired: true,
      dataRetention: 730,
    },
  },
  AU: {
    name: 'Australia',
    alcoholLaws: {
      legalAge: 18,
      restrictions: ['Last call laws vary by state', 'Responsible service of alcohol'],
    },
    operatingHours: {
      defaultOpen: '10:00',
      defaultClose: '01:00',
      weekendExtended: true,
      holidaysRestricted: false,
    },
    taxes: {
      name: 'GST',
      rate: 10,
      included: true,
    },
    licensing: {
      required: true,
      types: ['Liquor License'],
      renewalPeriod: 365,
    },
    dataPrivacy: {
      law: 'Privacy Act',
      consentRequired: true,
      dataRetention: 1095,
    },
  },
  JP: {
    name: 'Japan',
    alcoholLaws: {
      legalAge: 20,
      restrictions: [],
    },
    operatingHours: {
      defaultOpen: '17:00',
      defaultClose: '05:00',
      weekendExtended: false,
      holidaysRestricted: false,
    },
    taxes: {
      name: 'Consumption Tax',
      rate: 10,
      included: false,
    },
    licensing: {
      required: true,
      types: ['Liquor License'],
      renewalPeriod: 365,
    },
    dataPrivacy: {
      law: 'APPI',
      consentRequired: true,
      dataRetention: 730,
    },
  },
  KR: {
    name: 'South Korea',
    alcoholLaws: {
      legalAge: 19,
      restrictions: ['No sale after midnight for some drinks'],
    },
    operatingHours: {
      defaultOpen: '18:00',
      defaultClose: '02:00',
      holidaysRestricted: false,
    },
    taxes: {
      name: 'VAT',
      rate: 10,
      included: false,
    },
    licensing: {
      required: true,
      types: ['Liquor License'],
      renewalPeriod: 365,
    },
    dataPrivacy: {
      law: 'PIPA',
      consentRequired: true,
      dataRetention: 730,
    },
  },
  AE: {
    name: 'United Arab Emirates',
    alcoholLaws: {
      legalAge: 21,
      restrictions: ['Only in licensed areas', 'No public consumption'],
    },
    operatingHours: {
      defaultOpen: '12:00',
      defaultClose: '02:00',
      holidaysRestricted: true,
    },
    taxes: {
      name: 'VAT',
      rate: 5,
      included: false,
    },
    licensing: {
      required: true,
      types: ['Alcohol License'],
      renewalPeriod: 365,
    },
    dataPrivacy: {
      law: 'PDPL',
      consentRequired: true,
      dataRetention: 730,
    },
  },
  DE: {
    name: 'Germany',
    alcoholLaws: {
      legalAge: 16,
      restrictions: ['No spirits under 18'],
    },
    operatingHours: {
      defaultOpen: '10:00',
      defaultClose: '01:00',
      weekendExtended: true,
      holidaysRestricted: false,
    },
    taxes: {
      name: 'VAT',
      rate: 19,
      included: false,
    },
    licensing: {
      required: true,
      types: ['Gastronomy License'],
      renewalPeriod: 365,
    },
    dataPrivacy: {
      law: 'DSGVO',
      consentRequired: true,
      dataRetention: 730,
    },
  },
  FR: {
    name: 'France',
    alcoholLaws: {
      legalAge: 18,
      restrictions: [],
    },
    operatingHours: {
      defaultOpen: '10:00',
      defaultClose: '02:00',
      weekendExtended: false,
      holidaysRestricted: false,
    },
    taxes: {
      name: 'TVA',
      rate: 20,
      included: false,
    },
    licensing: {
      required: true,
      types: ['Licence III'],
      renewalPeriod: 365,
    },
    dataPrivacy: {
      law: 'RGPD',
      consentRequired: true,
      dataRetention: 730,
    },
  },
  ES: {
    name: 'Spain',
    alcoholLaws: {
      legalAge: 18,
      restrictions: [],
    },
    operatingHours: {
      defaultOpen: '10:00',
      defaultClose: '03:00',
      weekendExtended: true,
      holidaysRestricted: false,
    },
    taxes: {
      name: 'IVA',
      rate: 21,
      included: false,
    },
    licensing: {
      required: true,
      types: ['Licencia de apertura'],
      renewalPeriod: 365,
    },
    dataPrivacy: {
      law: 'RGPD',
      consentRequired: true,
      dataRetention: 730,
    },
  },
  IT: {
    name: 'Italy',
    alcoholLaws: {
      legalAge: 18,
      restrictions: [],
    },
    operatingHours: {
      defaultOpen: '10:00',
      defaultClose: '02:00',
      weekendExtended: false,
      holidaysRestricted: false,
    },
    taxes: {
      name: 'IVA',
      rate: 22,
      included: false,
    },
    licensing: {
      required: true,
      types: ['Licenza'],
      renewalPeriod: 365,
    },
    dataPrivacy: {
      law: 'GDPR',
      consentRequired: true,
      dataRetention: 730,
    },
  },
  NL: {
    name: 'Netherlands',
    alcoholLaws: {
      legalAge: 18,
      restrictions: [],
    },
    operatingHours: {
      defaultOpen: '10:00',
      defaultClose: '02:00',
      weekendExtended: true,
      holidaysRestricted: false,
    },
    taxes: {
      name: 'BTW',
      rate: 21,
      included: false,
    },
    licensing: {
      required: true,
      types: ['Drank-en Horecavergunning'],
      renewalPeriod: 365,
    },
    dataPrivacy: {
      law: 'AVG',
      consentRequired: true,
      dataRetention: 730,
    },
  },
  XX: {
    name: 'International Default',
    alcoholLaws: {
      legalAge: 18,
      restrictions: [],
    },
    operatingHours: {
      defaultOpen: '18:00',
      defaultClose: '02:00',
      holidaysRestricted: false,
    },
    taxes: {
      name: 'VAT',
      rate: 10,
      included: false,
    },
    licensing: {
      required: true,
      types: ['General License'],
      renewalPeriod: 365,
    },
    dataPrivacy: {
      law: 'GDPR',
      consentRequired: true,
      dataRetention: 730,
    },
  },
};

// Financial split adjustments per jurisdiction
export const REVENUE_SPLIT_RULES: Record<CountryCode, {
  platform: number;
  venue: number;
  creator: number;
  taxWithholding: number;
  additionalFees: { name: string; rate: number }[];
}> = {
  ID: {
    platform: 0.12,
    venue: 0.78,
    creator: 0.05,
    taxWithholding: 0.02,
    additionalFees: [{ name: 'PB1', rate: 0.10 }],
  },
  US: {
    platform: 0.15,
    venue: 0.70,
    creator: 0.10,
    taxWithholding: 0.03,
    additionalFees: [],
  },
  GB: {
    platform: 0.15,
    venue: 0.70,
    creator: 0.10,
    taxWithholding: 0.02,
    additionalFees: [],
  },
  TH: {
    platform: 0.12,
    venue: 0.78,
    creator: 0.05,
    taxWithholding: 0.03,
    additionalFees: [],
  },
  SG: {
    platform: 0.12,
    venue: 0.80,
    creator: 0.05,
    taxWithholding: 0.02,
    additionalFees: [],
  },
  MY: {
    platform: 0.12,
    venue: 0.78,
    creator: 0.05,
    taxWithholding: 0.03,
    additionalFees: [],
  },
  AU: {
    platform: 0.15,
    venue: 0.70,
    creator: 0.10,
    taxWithholding: 0.03,
    additionalFees: [],
  },
  JP: {
    platform: 0.15,
    venue: 0.70,
    creator: 0.10,
    taxWithholding: 0.03,
    additionalFees: [],
  },
  KR: {
    platform: 0.15,
    venue: 0.70,
    creator: 0.10,
    taxWithholding: 0.03,
    additionalFees: [],
  },
  AE: {
    platform: 0.12,
    venue: 0.80,
    creator: 0.05,
    taxWithholding: 0.02,
    additionalFees: [],
  },
  DE: {
    platform: 0.15,
    venue: 0.70,
    creator: 0.10,
    taxWithholding: 0.02,
    additionalFees: [],
  },
  FR: {
    platform: 0.15,
    venue: 0.70,
    creator: 0.10,
    taxWithholding: 0.02,
    additionalFees: [],
  },
  ES: {
    platform: 0.15,
    venue: 0.70,
    creator: 0.10,
    taxWithholding: 0.02,
    additionalFees: [],
  },
  IT: {
    platform: 0.15,
    venue: 0.70,
    creator: 0.10,
    taxWithholding: 0.02,
    additionalFees: [],
  },
  NL: {
    platform: 0.15,
    venue: 0.70,
    creator: 0.10,
    taxWithholding: 0.02,
    additionalFees: [],
  },
  XX: {
    platform: 0.15,
    venue: 0.70,
    creator: 0.10,
    taxWithholding: 0.02,
    additionalFees: [],
  },
};

// Get jurisdiction by coordinates (mock - would use geocoding service)
export async function getJurisdictionByCoordinates(
  lat: number,
  lng: number
): Promise<CountryCode> {
  // Simplified logic - in production would use Google Maps Geocoding API
  // Based on rough coordinates:
  
  // Indonesia: roughly lat -6 to 6, lng 95 to 141
  if (lat >= -11 && lat <= 6 && lng >= 95 && lng <= 141) {
    return 'ID';
  }
  
  // Thailand: lat 5-21, lng 97-106
  if (lat >= 5 && lat <= 21 && lng >= 97 && lng <= 106) {
    return 'TH';
  }
  
  // Singapore: lat 1.2-1.5, lng 103.6-104
  if (lat >= 1.2 && lat <= 1.5 && lng >= 103.6 && lng <= 104) {
    return 'SG';
  }
  
  // Malaysia: lat 0.5-7, lng 99-120
  if (lat >= 0.5 && lat <= 7 && lng >= 99 && lng <= 120) {
    return 'MY';
  }
  
  // UK: lat 49-61, lng -8 to 2
  if (lat >= 49 && lat <= 61 && lng >= -8 && lng <= 2) {
    return 'GB';
  }
  
  // US: lat 24-49, lng -125 to -66
  if (lat >= 24 && lat <= 49 && lng >= -125 && lng <= -66) {
    return 'US';
  }
  
  // Australia: lat -44 to -10, lng 112 to 154
  if (lat >= -44 && lat <= -10 && lng >= 112 && lng <= 154) {
    return 'AU';
  }
  
  // Japan: lat 24-46, lng 122 to 154
  if (lat >= 24 && lat <= 46 && lng >= 122 && lng <= 154) {
    return 'JP';
  }
  
  // South Korea: lat 33-39, lng 124-132
  if (lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132) {
    return 'KR';
  }
  
  // UAE: lat 22-26, lng 51-57
  if (lat >= 22 && lat <= 26 && lng >= 51 && lng <= 57) {
    return 'AE';
  }
  
  // Germany: lat 47-55, lng 5-16
  if (lat >= 47 && lat <= 55 && lng >= 5 && lng <= 16) {
    return 'DE';
  }
  
  // France: lat 41-51, lng -5 to 10
  if (lat >= 41 && lat <= 51 && lng >= -5 && lng <= 10) {
    return 'FR';
  }
  
  // Spain: lat 36-44, lng -10 to 5
  if (lat >= 36 && lat <= 44 && lng >= -10 && lng <= 5) {
    return 'ES';
  }
  
  // Italy: lat 36-47, lng 6-19
  if (lat >= 36 && lat <= 47 && lng >= 6 && lng <= 19) {
    return 'IT';
  }
  
  // Netherlands: lat 50-54, lng 3-8
  if (lat >= 50 && lat <= 54 && lng >= 3 && lng <= 8) {
    return 'NL';
  }
  
  return 'XX';
}

/**
 * Get complete jurisdiction config for a venue
 */
export function getJurisdictionConfig(countryCode: CountryCode) {
  return JURISDICTION_CONFIG[countryCode] || JURISDICTION_CONFIG.XX;
}

/**
 * Get revenue split rules for jurisdiction
 */
export function getRevenueSplitRules(countryCode: CountryCode) {
  return REVENUE_SPLIT_RULES[countryCode] || REVENUE_SPLIT_RULES.XX;
}

/**
 * Calculate final price with all taxes
 */
export function calculateFinalPrice(
  basePrice: number,
  countryCode: CountryCode
): {
  subtotal: number;
  taxes: { name: string; amount: number }[];
  total: number;
} {
  const jurisdiction = getJurisdictionConfig(countryCode);
  const taxes: { name: string; amount: number }[] = [];
  
  const subtotal = basePrice;
  
  // Add main tax
  const mainTax = basePrice * (jurisdiction.taxes.rate / 100);
  taxes.push({ name: jurisdiction.taxes.name, amount: mainTax });
  
  // Add additional taxes
  if (jurisdiction.taxes.additional) {
    jurisdiction.taxes.additional.forEach((tax: { name: string; rate: number }) => {
      const amount = basePrice * (tax.rate / 100);
      taxes.push({ name: tax.name, amount });
    });
  }
  
  const total = jurisdiction.taxes.included ? basePrice : subtotal + taxes.reduce((sum, t) => sum + t.amount, 0);
  
  return {
    subtotal,
    taxes,
    total,
  };
}

/**
 * Check if venue can operate at given time
 */
export function canVenueOperate(
  countryCode: CountryCode,
  dayOfWeek: number, // 0 = Sunday
  hour: number,
  isHoliday: boolean
): { allowed: boolean; reason?: string } {
  const jurisdiction = getJurisdictionConfig(countryCode);
  const config = jurisdiction.operatingHours;
  
  // Parse hours
  const [openHour] = config.defaultOpen.split(':').map(Number);
  const [closeHour] = config.defaultClose.split(':').map(Number);
  
  // Check holiday restriction
  if (config.holidaysRestricted && isHoliday) {
    return { allowed: false, reason: 'Operating hours restricted on holidays' };
  }
  
  // Weekend check
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  if (isWeekend && config.weekendExtended) {
    return { allowed: true };
  }
  
  // Time check
  if (hour >= openHour && hour < closeHour) {
    return { allowed: true };
  }
  
  return { 
    allowed: false, 
    reason: `Operating hours are ${config.defaultOpen} - ${config.defaultClose}` 
  };
}

/**
 * Validate user age for venue
 */
export function validateAge(
  countryCode: CountryCode,
  userAge: number
): { allowed: boolean; reason?: string } {
  const jurisdiction = getJurisdictionConfig(countryCode);
  const legalAge = jurisdiction.alcoholLaws.legalAge;
  
  if (userAge >= legalAge) {
    return { allowed: true };
  }
  
  return { 
    allowed: false, 
    reason: `Legal drinking age is ${legalAge} in ${jurisdiction.name}` 
  };
}

/**
 * Get platform terms based on jurisdiction
 */
export function getPlatformTerms(countryCode: CountryCode) {
  const jurisdiction = getJurisdictionConfig(countryCode);
  const split = getRevenueSplitRules(countryCode);
  
  return {
    legalName: `Vibe Protocol ${jurisdiction.name}`,
    governingLaw: jurisdiction.dataPrivacy.law,
    dataRetention: jurisdiction.dataPrivacy.dataRetention,
    consentRequired: jurisdiction.dataPrivacy.consentRequired,
    revenueSplit: split,
    operatingHours: jurisdiction.operatingHours,
    alcoholRestrictions: jurisdiction.alcoholLaws.restrictions,
  };
}
