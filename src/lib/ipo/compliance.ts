/**
 * CORPORATE GOVERNANCE & COMPLIANCE
 * Phase 9: Strategic Exit & IPO Preparation
 * 
 * Features:
 * - Tax compliance (PB1)
 * - Labor compliance
 * - Data privacy (UU PDP/GDPR)
 * - SOC2 Type II compliance logging
 */

export const COMPLIANCE_CONFIG = {
  // Tax Compliance
  tax: {
    pb1: {
      name: 'Pajak Badan (PB1)',
      description: 'Corporate Income Tax - Indonesia',
      rate: 0.22, // 22% for companies
      filingFrequency: 'annual',
      dueDate: 'April 30',
    },
    pph21: {
      name: 'PPh Pasal 21',
      description: 'Employee Income Tax',
      filingFrequency: 'monthly',
    },
    ppn: {
      name: 'PPN (VAT)',
      description: 'Value Added Tax',
      rate: 0.11, // 11%
      filingFrequency: 'monthly',
    },
    localTax: {
      name: 'Pajak Daerah',
      description: 'Local Entertainment Tax',
      rate: 0.1, // 10% varies by city
    },
  },
  
  // Labor Compliance
  labor: {
    bpjs: {
      name: 'BPJS Kesehatan & Ketenagakerjaan',
      description: 'Social Security',
      employerContribution: {
        kesehatan: 0.04, // 4%
        ketenagakerjaan: 0.057, // 5.7% (varies)
      },
      employeeContribution: {
        kesehatan: 0.01, // 1%
        ketenagakerjaan: 0.02, // 2%
      },
    },
    umk: {
      name: 'Upah Minimum Kota (UMK)',
      description: 'Minimum Regional Wage',
      updateFrequency: 'annual',
    },
    thr: {
      name: 'Tunjangan Hari Raya (THR)',
      description: 'Religious Holiday Allowance',
      rate: 1, // 1 month salary
      dueDate: 'H-7 before Hari Raya',
    },
    severance: {
      name: 'Pesangon',
      description: 'Severance Pay',
      calculation: 'Based on years of service',
    },
  },
  
  // Data Privacy (UU PDP & GDPR)
  dataPrivacy: {
    uuPdp: {
      name: 'UU No. 27 Tahun 2022 (PDP)',
      description: 'Indonesian Personal Data Protection Law',
      requirements: [
        'Data subject consent',
        'Data processing limitation',
        'Data retention policy',
        'Breach notification (3x24 hours)',
        'Data transfer restrictions',
      ],
    },
    gdpr: {
      name: 'GDPR',
      description: 'EU General Data Protection Regulation',
      requirements: [
        'Lawful basis for processing',
        'Data subject rights',
        'Data protection impact assessment',
        'Cross-border transfer restrictions',
        '72-hour breach notification',
      ],
    },
    dataRetention: {
      name: 'Data Retention Policy',
      retentionPeriods: {
        userAccounts: '7 years after last activity',
        transactions: '10 years',
        logs: '2 years',
        marketing: 'until consent withdrawn',
      },
    },
  },
  
  // SOC2 Type II
  soc2: {
    trustServiceCriteria: [
      'Security',
      'Availability',
      'Processing Integrity',
      'Confidentiality',
      'Privacy',
    ],
    auditFrequency: 'annual',
    auditPeriod: '12 months',
    controls: {
      accessControl: 'Multi-factor authentication, role-based access',
      encryption: 'AES-256 at rest, TLS 1.3 in transit',
      logging: 'Immutable audit trails',
      incidentResponse: '24/7 SOC monitoring',
    },
  },
};

export const COMPLIANCE_REPORT_TYPES = {
  tax: {
    pb1_annual: 'Annual Corporate Tax Return',
    pph21_monthly: 'Monthly Withholding Tax',
    ppn_monthly: 'Monthly VAT Return',
    local_tax_monthly: 'Monthly Entertainment Tax',
  },
  labor: {
    bpjs_monthly: 'Monthly BPJS Contribution',
    umk_annual: 'Annual UMK Compliance',
    thr_annual: 'Annual THR Calculation',
  },
  privacy: {
    data_inventory: 'Data Inventory Report',
    consent_management: 'Consent Management Report',
    breach_log: 'Data Breach Incident Log',
    processing_activities: 'Data Processing Activities Register',
  },
  soc2: {
    controls_evidence: 'SOC2 Controls Evidence',
    audit_trail: 'Audit Trail Report',
    vulnerability_scan: 'Vulnerability Assessment',
    penetration_test: 'Penetration Testing Report',
  },
};

export interface ComplianceReport {
  id: string;
  type: keyof typeof COMPLIANCE_REPORT_TYPES;
  title: string;
  period: string;
  status: 'compliant' | 'non_compliant' | 'in_progress' | 'pending_review';
  lastGenerated: Date;
  dueDate: Date;
  findings?: string[];
}

export interface TaxSummary {
  period: string;
  pb1: {
    revenue: number;
    deductibleExpenses: number;
    taxableIncome: number;
    taxPayable: number;
  };
  ppn: {
    outputTax: number;
    inputTax: number;
    netVat: number;
  };
  localTax: {
    entertainmentTax: number;
  };
}

export interface LaborCompliance {
  period: string;
  totalEmployees: number;
  bpjs: {
    kesehatan: {
      employerShare: number;
      employeeShare: number;
      total: number;
    };
    ketenagakerjaan: {
      employerShare: number;
      employeeShare: number;
      total: number;
    };
  };
  thr: {
    totalRequired: number;
    distributed: number;
  };
  umk: {
    minimumWage: number;
    compliant: boolean;
  };
}

export interface PrivacyCompliance {
  dataInventory: {
    totalRecords: number;
    personalData: number;
    sensitiveData: number;
    lastUpdated: Date;
  };
  consentRate: number;
  breachIncidents: {
    total: number;
    last30Days: number;
    resolved: number;
  };
  crossBorderTransfers: number;
}

export interface SOC2Compliance {
  auditPeriod: string;
  status: 'compliant' | 'non_compliant' | 'in_progress';
  controls: Record<string, {
    status: 'effective' | 'ineffective' | 'needs_improvement';
    lastTested: Date;
    findings?: string[];
  }>;
  exceptions: number;
  recommendations: string[];
}

/**
 * Generate compliance report
 */
export function generateComplianceReport(
  type: keyof typeof COMPLIANCE_REPORT_TYPES
): ComplianceReport {
  // Get title based on type
  let title = 'Report';
  if (type === 'tax') title = 'Tax Compliance Report';
  else if (type === 'labor') title = 'Labor Compliance Report';
  else if (type === 'privacy') title = 'Privacy Compliance Report';
  else if (type === 'soc2') title = 'SOC2 Compliance Report';
  
  return {
    id: `RPT-${Date.now()}`,
    type,
    title,
    period: new Date().toISOString().slice(0, 7),
    status: 'compliant',
    lastGenerated: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  };
}

/**
 * Calculate PB1 tax
 */
export function calculatePB1Tax(revenue: number, expenses: number): TaxSummary {
  const taxableIncome = Math.max(0, revenue - expenses);
  const taxPayable = taxableIncome * COMPLIANCE_CONFIG.tax.pb1.rate;
  
  return {
    period: new Date().toISOString().slice(0, 7),
    pb1: {
      revenue,
      deductibleExpenses: expenses,
      taxableIncome,
      taxPayable,
    },
    ppn: {
      outputTax: revenue * COMPLIANCE_CONFIG.tax.ppn.rate,
      inputTax: expenses * COMPLIANCE_CONFIG.tax.ppn.rate,
      netVat: 0,
    },
    localTax: {
      entertainmentTax: revenue * COMPLIANCE_CONFIG.tax.localTax.rate,
    },
  };
}

/**
 * Calculate labor compliance costs
 */
export function calculateLaborCompliance(
  employees: {
    count: number;
    totalSalary: number;
    avgTenure: number;
  }
): LaborCompliance {
  const { count, totalSalary } = employees;
  
  const bpjsKesehatan = {
    employerShare: totalSalary * COMPLIANCE_CONFIG.labor.bpjs.employerContribution.kesehatan,
    employeeShare: totalSalary * COMPLIANCE_CONFIG.labor.bpjs.employeeContribution.kesehatan,
    total: 0,
  };
  bpjsKesehatan.total = bpjsKesehatan.employerShare + bpjsKesehatan.employeeShare;
  
  const bpjsKetenagakerjaan = {
    employerShare: totalSalary * COMPLIANCE_CONFIG.labor.bpjs.employerContribution.ketenagakerjaan,
    employeeShare: totalSalary * COMPLIANCE_CONFIG.labor.bpjs.employeeContribution.ketenagakerjaan,
    total: 0,
  };
  bpjsKetenagakerjaan.total = bpjsKetenagakerjaan.employerShare + bpjsKetenagakerjaan.employeeShare;
  
  return {
    period: new Date().toISOString().slice(0, 7),
    totalEmployees: count,
    bpjs: {
      kesehatan: bpjsKesehatan,
      ketenagakerjaan: bpjsKetenagakerjaan,
    },
    thr: {
      totalRequired: totalSalary, // 1 month salary
      distributed: 0,
    },
    umk: {
      minimumWage: 5000000, // Example UMK Jakarta 2024
      compliant: true,
    },
  };
}
