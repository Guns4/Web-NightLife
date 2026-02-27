/**
 * REVENUE SPLIT CONTRACT
 * Phase 8: Web3 & Decentralized Vibe Economy
 * 
 * Concept: Automated payment distribution for venue services
 * Standard: Custom Split Contract
 * 
 * Features:
 * - Automatic revenue distribution on payment
 * - Configurable split percentages
 * - Supports: Venue, Platform, Influencer, Rewards Pool
 * - Real-time settlement
 * - Dispute handling
 */

export const REVENUE_SPLIT_CONFIG = {
  name: 'NightLife Revenue Splitter',
  network: 'polygon',
  chainId: 137,
  
  // Default revenue split
  defaultSplit: {
    venue: 85,      // 85% to venue
    platform: 10,   // 10% to platform
    influencer: 3,  // 3% to influencer/KOL
    rewards: 2,     // 2% to liquidity/rewards pool
  },
  
  // Service types with different splits
  serviceTypes: {
    squadTable: {
      name: 'Squad Table',
      split: {
        venue: 85,
        platform: 10,
        influencer: 3,
        rewards: 2,
      },
      minAmount: 100, // USD
      processingFee: 2.5, // %
    },
    bottleService: {
      name: 'Bottle Service',
      split: {
        venue: 80,
        platform: 12,
        influencer: 5,
        rewards: 3,
      },
      minAmount: 200,
      processingFee: 2.5,
    },
    coverCharge: {
      name: 'Cover Charge',
      split: {
        venue: 90,
        platform: 8,
        influencer: 0,
        rewards: 2,
      },
      minAmount: 10,
      processingFee: 2.9,
    },
    vipBooking: {
      name: 'VIP Booking',
      split: {
        venue: 82,
        platform: 10,
        influencer: 5,
        rewards: 3,
      },
      minAmount: 500,
      processingFee: 2.5,
    },
    promoterPayout: {
      name: 'Promoter Payout',
      split: {
        venue: 0,
        platform: 5,
        influencer: 0,
        rewards: 0,
      },
      // For promoter/influencer payouts
      isPayout: true,
      processingFee: 2.5,
    },
  },
  
  // Payment methods
  paymentMethods: {
    crypto: {
      enabled: true,
      tokens: ['MATIC', 'USDC', 'USDT'],
      discount: 5, // 5% discount for crypto
    },
    fiat: {
      enabled: true,
      methods: ['card', 'ewallet', 'bank'],
    },
    mixed: {
      enabled: true,
      cryptoPercentage: 50,
    }
  },
  
  // Settlement
  settlement: {
    // Crypto settlements are immediate
    cryptoSettlementTime: 0, // immediate
    // Fiat settlements
    fiatSettlementTime: 2 * 24 * 60 * 60, // 2 days
    minPayout: 10, // Minimum payout threshold
    payoutSchedule: 'daily', // daily, weekly, monthly
  },
  
  // Dispute handling
  dispute: {
    window: 7 * 24 * 60 * 60, // 7 days to open dispute
    resolutionTime: 3 * 24 * 60 * 60, // 3 days to resolve
    refundPercentage: 0.5, // Max 50% refund
  }
};

/**
 * Revenue Split ABI Fragments
 */
export const REVENUE_SPLIT_ABI = {
  // Core split functions
  split: [
    'function splitPayment(bytes32 paymentId, uint256 amount, address[] recipients, uint256[] percentages) payable',
    'function getPaymentRecipients(bytes32 paymentId) view returns (address[])',
    'function getPaymentAmounts(bytes32 paymentId) view returns (uint256[])',
    'function getPaymentStatus(bytes32 paymentId) view returns (uint8)',
    'function getServiceType(bytes32 paymentId) view returns (bytes32)',
    'event PaymentSplit(bytes32 indexed paymentId, uint256 totalAmount, address[] recipients, uint256[] amounts)',
    'event PaymentSettled(bytes32 indexed paymentId, address recipient, uint256 amount)',
  ],
  
  // Configuration
  config: [
    'function setSplitPercentages(address venue, uint8 venuePercent, uint8 platformPercent, uint8 influencerPercent, uint8 rewardsPercent)',
    'function getSplitPercentages(address venue) view returns (uint8, uint8, uint8, uint8)',
    'function setVenueAddress(address venue, address payoutAddress)',
    'function setInfluencer(address paymentId, address influencer)',
    'function enableServiceType(bytes32 serviceType, bool enabled)',
  ],
  
  // Dispute
  dispute: [
    'function openDispute(bytes32 paymentId, string reason)',
    'function resolveDispute(bytes32 paymentId, uint256 refundAmount, address refundRecipient)',
    'function getDispute(bytes32 paymentId) view returns (bytes32, uint8, string, uint256)',
    'event DisputeOpened(bytes32 indexed paymentId, string reason)',
    'event DisputeResolved(bytes32 indexed paymentId, uint256 refundAmount)',
  ],
  
  // Rewards
  rewards: [
    'function addToRewardsPool(uint256 amount) payable',
    'function distributeRewards(address[] recipients, uint256[] amounts)',
    'function getRewardsBalance(address recipient) view returns (uint256)',
    'function claimRewards() returns (uint256)',
    'event RewardsDistributed(address indexed recipient, uint256 amount)',
  ]
};

/**
 * Revenue Split Data Interface
 */
export interface RevenueSplitData {
  paymentId: string;
  serviceType: string;
  totalAmount: number;
  amountAfterFees: number;
  split: {
    venue: number;
    platform: number;
    influencer: number;
    rewards: number;
  };
  recipients: {
    venue: string;
    platform: string;
    influencer?: string;
    rewards: string;
  };
  amounts: {
    venue: number;
    platform: number;
    influencer: number;
    rewards: number;
  };
  status: 'pending' | 'processing' | 'settled' | 'disputed' | 'refunded';
  timestamp: Date;
  txHash?: string;
}

/**
 * Payout Details Interface
 */
export interface PayoutDetails {
  recipient: string;
  amount: number;
  type: 'venue' | 'platform' | 'influencer' | 'rewards';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  settledAt?: Date;
  txHash?: string;
}

/**
 * Service Type Configuration
 */
export interface ServiceTypeConfig {
  name: string;
  split: typeof REVENUE_SPLIT_CONFIG.defaultSplit;
  minAmount: number;
  processingFee: number;
  isPayout?: boolean;
}

/**
 * Calculate revenue split
 */
export function calculateRevenueSplit(
  amount: number,
  serviceType: keyof typeof REVENUE_SPLIT_CONFIG.serviceTypes,
  influencerAddress?: string
): RevenueSplitData {
  const serviceConfig = REVENUE_SPLIT_CONFIG.serviceTypes[serviceType];
  const split = serviceConfig.split;
  
  // Calculate processing fee
  const processingFee = amount * (serviceConfig.processingFee / 100);
  const amountAfterFees = amount - processingFee;
  
  // Calculate split amounts
  const amounts = {
    venue: amountAfterFees * (split.venue / 100),
    platform: amountAfterFees * (split.platform / 100),
    influencer: split.influencer > 0 && influencerAddress ? amountAfterFees * (split.influencer / 100) : 0,
    rewards: amountAfterFees * (split.rewards / 100),
  };
  
  return {
    paymentId: generatePaymentId(),
    serviceType,
    totalAmount: amount,
    amountAfterFees,
    split,
    recipients: {
      venue: '', // Set by venue config
      platform: process.env.PLATFORM_WALLET_ADDRESS || '',
      influencer: influencerAddress || '',
      rewards: process.env.REWARDS_POOL_ADDRESS || '',
    },
    amounts,
    status: 'pending',
    timestamp: new Date(),
  };
}

/**
 * Generate unique payment ID
 */
export function generatePaymentId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `0x${timestamp}${random}`;
}

/**
 * Split payment recipients and amounts for contract call
 */
export function formatSplitForContract(split: RevenueSplitData): {
  recipients: string[];
  percentages: number[];
} {
  const recipients: string[] = [];
  const percentages: number[] = [];
  
  if (split.amounts.venue > 0) {
    recipients.push(split.recipients.venue);
    percentages.push(split.split.venue);
  }
  
  if (split.amounts.platform > 0) {
    recipients.push(split.recipients.platform);
    percentages.push(split.split.platform);
  }
  
  if (split.amounts.influencer > 0 && split.recipients.influencer) {
    recipients.push(split.recipients.influencer);
    percentages.push(split.split.influencer);
  }
  
  if (split.amounts.rewards > 0) {
    recipients.push(split.recipients.rewards);
    percentages.push(split.split.rewards);
  }
  
  return { recipients, percentages };
}

/**
 * Get service type config
 */
export function getServiceTypeConfig(
  serviceType: keyof typeof REVENUE_SPLIT_CONFIG.serviceTypes
): ServiceTypeConfig | undefined {
  return REVENUE_SPLIT_CONFIG.serviceTypes[serviceType] as ServiceTypeConfig | undefined;
}

/**
 * Apply crypto discount
 */
export function applyCryptoDiscount(amount: number): number {
  return amount * (1 - REVENUE_SPLIT_CONFIG.paymentMethods.crypto.discount / 100);
}

/**
 * Settlement status interface
 */
export interface SettlementStatus {
  paymentId: string;
  venue: PayoutDetails;
  platform: PayoutDetails;
  influencer?: PayoutDetails;
  rewards: PayoutDetails;
  allSettled: boolean;
  settledAt?: Date;
}

/**
 * Create settlement status from split
 */
export function createSettlementStatus(split: RevenueSplitData): SettlementStatus {
  return {
    paymentId: split.paymentId,
    venue: {
      recipient: split.recipients.venue,
      amount: split.amounts.venue,
      type: 'venue',
      status: 'pending',
    },
    platform: {
      recipient: split.recipients.platform,
      amount: split.amounts.platform,
      type: 'platform',
      status: 'pending',
    },
    influencer: split.recipients.influencer ? {
      recipient: split.recipients.influencer,
      amount: split.amounts.influencer,
      type: 'influencer',
      status: 'pending',
    } : undefined,
    rewards: {
      recipient: split.recipients.rewards,
      amount: split.amounts.rewards,
      type: 'rewards',
      status: 'pending',
    },
    allSettled: false,
  };
}
