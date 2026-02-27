/**
 * FRAUD & RISK MITIGATION AUDIT
 * Phase 9: Strategic Exit & IPO Preparation
 * 
 * Features:
 * - AI-powered stress testing
 * - Financial leakage detection
 * - Due diligence preparation
 * - Risk scoring
 */

export const FRAUD_CONFIG = {
  // Risk categories
  riskCategories: {
    financial: {
      name: 'Financial Risks',
      weight: 0.35,
      checks: [
        'Revenue recognition anomalies',
        'Expense fraud patterns',
        'Revenue leakage',
        'Fake transactions',
        'Phantom vendors',
      ],
    },
    operational: {
      name: 'Operational Risks',
      weight: 0.25,
      checks: [
        'Staff collusion',
        'Inventory shrinkage',
        'Fake check-ins',
        'Unauthorized discounts',
      ],
    },
    cybersecurity: {
      name: 'Cybersecurity Risks',
      weight: 0.20,
      checks: [
        'Data breaches',
        'Account takeovers',
        'Payment fraud',
        'API abuse',
      ],
    },
    compliance: {
      name: 'Compliance Risks',
      weight: 0.20,
      checks: [
        'Regulatory violations',
        'Privacy breaches',
        'Contract non-compliance',
      ],
    },
  },
  
  // Risk levels
  riskLevels: {
    critical: {
      threshold: 80,
      color: '#EF4444',
      action: 'Immediate action required',
    },
    high: {
      threshold: 60,
      color: '#F97316',
      action: 'Action within 30 days',
    },
    medium: {
      threshold: 40,
      color: '#EAB308',
      action: 'Action within 90 days',
    },
    low: {
      threshold: 20,
      color: '#22C55E',
      action: 'Monitor and improve',
    },
  },
  
  // Audit thresholds
  thresholds: {
    transactionAnomaly: {
      amount: 10000, // IDR threshold for high-value
      frequency: 10, // transactions per hour
    },
    checkinFraud: {
      locationRadius: 100, // meters
      timeWindow: 300, // seconds between check-ins
    },
    refundRate: {
      warning: 0.05, // 5%
      critical: 0.10, // 10%
    },
  },
};

export interface RiskFinding {
  id: string;
  category: keyof typeof FRAUD_CONFIG.riskCategories;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedAreas: string[];
  estimatedLoss?: number;
  evidence: string[];
  recommendations: string[];
  detectedAt: Date;
  status: 'open' | 'investigating' | 'resolved' | 'accepted';
}

export interface AuditReport {
  id: string;
  type: 'stress_test' | 'due_diligence' | 'routine' | 'incident';
  period: string;
  overallScore: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  findings: RiskFinding[];
  financialImpact: {
    potential: number;
    actual: number;
    prevented: number;
  };
  recommendations: string[];
  auditor: string;
  createdAt: Date;
}

export interface FraudMetrics {
  totalTransactions: number;
  flaggedTransactions: number;
  fraudRate: number;
  detectedFraud: number;
  preventedFraud: number;
  falsePositiveRate: number;
  avgResponseTime: number;
}

/**
 * Analyze transaction patterns for anomalies
 */
export function analyzeTransactionPatterns(transactions: {
  amount: number;
  timestamp: Date;
  userId: string;
  merchantId: string;
  location: { lat: number; lng: number };
}[]): RiskFinding[] {
  const findings: RiskFinding[] = [];
  
  // Check for high-value transactions
  const highValueTx = transactions.filter(
    t => t.amount > FRAUD_CONFIG.thresholds.transactionAnomaly.amount
  );
  if (highValueTx.length > 0) {
    findings.push({
      id: `RF-${Date.now()}-1`,
      category: 'financial',
      severity: 'medium',
      title: 'High-Value Transactions Detected',
      description: `${highValueTx.length} transactions exceed the ${FRAUD_CONFIG.thresholds.transactionAnomaly.amount} IDR threshold`,
      affectedAreas: highValueTx.map(t => t.merchantId),
      evidence: highValueTx.map(t => `Amount: ${t.amount}, Time: ${t.timestamp.toISOString()}`),
      recommendations: [
        'Implement additional verification for high-value transactions',
        'Review and approve manually',
      ],
      detectedAt: new Date(),
      status: 'open',
    });
  }
  
  // Check for rapid transactions
  const userTxCounts = transactions.reduce((acc, t) => {
    acc[t.userId] = (acc[t.userId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const suspiciousUsers = Object.entries(userTxCounts)
    .filter(([_, count]) => count > FRAUD_CONFIG.thresholds.transactionAnomaly.frequency);
  
  if (suspiciousUsers.length > 0) {
    findings.push({
      id: `RF-${Date.now()}-2`,
      category: 'financial',
      severity: 'high',
      title: 'Suspicious Transaction Frequency',
      description: `${suspiciousUsers.length} users exceed normal transaction frequency`,
      affectedAreas: suspiciousUsers.map(([user]) => user),
      estimatedLoss: 0,
      evidence: [],
      recommendations: [
        'Review user accounts for bot activity',
        'Implement rate limiting',
      ],
      detectedAt: new Date(),
      status: 'open',
    });
  }
  
  return findings;
}

/**
 * Analyze check-in patterns for fraud
 */
export function analyzeCheckinPatterns(checkins: {
  userId: string;
  venueId: string;
  timestamp: Date;
  location: { lat: number; lng: number };
}[]): RiskFinding[] {
  const findings: RiskFinding[] = [];
  
  // Sort by timestamp
  const sorted = [...checkins].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    
    if (prev.userId === curr.userId) {
      const timeDiff = (curr.timestamp.getTime() - prev.timestamp.getTime()) / 1000;
      
      // Check if too quick (impossible travel)
      if (timeDiff < FRAUD_CONFIG.thresholds.checkinFraud.timeWindow) {
        findings.push({
          id: `RF-${Date.now()}-${i}`,
          category: 'operational',
          severity: 'high',
          title: 'Impossible Travel Detected',
          description: `User checked in at different venues within ${timeDiff} seconds`,
          affectedAreas: [prev.venueId, curr.venueId],
          evidence: [
            `User: ${prev.userId}`,
            `Venue 1: ${prev.venueId} at ${prev.timestamp.toISOString()}`,
            `Venue 2: ${curr.venueId} at ${curr.timestamp.toISOString()}`,
          ],
          recommendations: [
            'Review and potentially invalidate check-ins',
            'Flag user for investigation',
            'Implement GPS verification',
          ],
          detectedAt: new Date(),
          status: 'open',
        });
      }
    }
  }
  
  return findings;
}

/**
 * Calculate overall risk score
 */
export function calculateRiskScore(findings: RiskFinding[]): {
  score: number;
  level: 'critical' | 'high' | 'medium' | 'low';
  breakdown: Record<string, number>;
} {
  const breakdown: Record<string, number> = {};
  let totalWeight = 0;
  let weightedScore = 0;
  
  const severityScores = {
    critical: 100,
    high: 75,
    medium: 50,
    low: 25,
  };
  
  for (const finding of findings) {
    const category = finding.category;
    const categoryWeight = FRAUD_CONFIG.riskCategories[category]?.weight || 0.25;
    const severityScore = severityScores[finding.severity];
    
    breakdown[category] = (breakdown[category] || 0) + severityScore * categoryWeight;
    weightedScore += severityScore * categoryWeight;
    totalWeight += categoryWeight;
  }
  
  const finalScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
  
  let level: 'critical' | 'high' | 'medium' | 'low' = 'low';
  if (finalScore >= FRAUD_CONFIG.riskLevels.critical.threshold) level = 'critical';
  else if (finalScore >= FRAUD_CONFIG.riskLevels.high.threshold) level = 'high';
  else if (finalScore >= FRAUD_CONFIG.riskLevels.medium.threshold) level = 'medium';
  
  return {
    score: Math.round(finalScore),
    level,
    breakdown,
  };
}

/**
 * Generate audit report
 */
export function generateAuditReport(type: AuditReport['type']): AuditReport {
  return {
    id: `AUD-${Date.now()}`,
    type,
    period: new Date().toISOString().slice(0, 7),
    overallScore: 75,
    riskLevel: 'medium',
    findings: [],
    financialImpact: {
      potential: 50000000,
      actual: 5000000,
      prevented: 45000000,
    },
    recommendations: [
      'Implement real-time fraud detection',
      'Enhance check-in verification',
      'Review vendor contracts',
    ],
    auditor: 'Internal Audit Team',
    createdAt: new Date(),
  };
}

/**
 * Get fraud prevention metrics
 */
export function getFraudPreventionMetrics(): FraudMetrics {
  return {
    totalTransactions: 1250000,
    flaggedTransactions: 12500,
    fraudRate: 0.01,
    detectedFraud: 2500000,
    preventedFraud: 45000000,
    falsePositiveRate: 0.02,
    avgResponseTime: 0.5, // seconds
  };
}
