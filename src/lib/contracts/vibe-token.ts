/**
 * VIBE TOKEN CONTRACT
 * Phase 8: Web3 & Decentralized Vibe Economy
 * 
 * Token Standards: ERC-20 / ERC-4626
 * Network: Polygon (L2) for low gas fees
 * 
 * Features:
 * - Staking for venue trending
 * - Governance voting power
 * - Loyalty rewards
 * - Automated revenue split integration
 */

export const VIBE_TOKEN_CONFIG = {
  name: 'VIBE Token',
  symbol: '$VIBE',
  decimals: 18,
  maxSupply: 1000000000, // 1 Billion
  network: 'polygon',
  chainId: 137,
  
  // Tokenomics
  distribution: {
    communityRewards: 40,      // 40% - User rewards & staking
    liquidityPool: 20,         // 20% - DEX liquidity
    teamTreasury: 15,          // 15% - Team & development
    platformRevenue: 15,       // 15% - Revenue share pool
    daoTreasury: 10,           // 10% - DAO governance
  },
  
  // Staking rewards
  staking: {
    minLockPeriod: 7 * 24 * 60 * 60, // 7 days in seconds
    earlyUnslashPenalty: 0.1,         // 10% penalty
    rewardAPY: 0.12,                   // 12% APY base
    venueBoostMultiplier: 2,           // 2x for venue staking
  },
  
  // Transaction limits
  limits: {
    minStakeAmount: 100,               // Min tokens to stake
    maxStakeAmount: 100000,            // Max tokens to stake per venue
    minTransferAmount: 1,              // Min transfer
    dailyTransferLimit: 10000,         // Daily limit
  }
};

// Contract Addresses (Placeholder - will be deployed)
export const CONTRACT_ADDRESSES = {
  polygon: {
    vibeToken: '0xVIBE_TOKEN_ADDRESS',
    soulboundToken: '0xSBT_ADDRESS',
    nftPass: '0xNFT_PASS_ADDRESS',
    revenueSplit: '0xREVENUE_SPLIT_ADDRESS',
    staking: '0xSTAKING_ADDRESS',
  },
  // For testing on Mumbai testnet
  mumbai: {
    vibeToken: '0xVIBE_TOKEN_MUMBAI',
    soulboundToken: '0xSBT_MUMBAI',
    nftPass: '0xNFT_PASS_MUMBAI',
    revenueSplit: '0xREVENUE_SPLIT_MUMBAI',
    staking: '0xSTAKING_MUMBAI',
  }
};

/**
 * ABI Fragments for VIBE Token Contract
 */
export const VIBE_TOKEN_ABI = {
  // ERC-20 Standard
  erc20: [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address account) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function transferFrom(address from, address to, uint256 amount) returns (bool)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)',
  ],
  
  // Staking
  staking: [
    'function stake(uint256 amount, address venue) returns (bool)',
    'function unstake(uint256 amount) returns (bool)',
    'function claimRewards() returns (uint256)',
    'function getStakeBalance(address user, address venue) view returns (uint256)',
    'function getPendingRewards(address user) view returns (uint256)',
    'function getVenueTotalStake(address venue) view returns (uint256)',
    'event Staked(address indexed user, address indexed venue, uint256 amount)',
    'event Unstaked(address indexed user, uint256 amount)',
    'event RewardClaimed(address indexed user, uint256 reward)',
  ],
  
  // Governance
  governance: [
    'function delegate(address delegatee) returns (bool)',
    'function getVotes(address account) view returns (uint256)',
    'function castVote(uint256 proposalId, uint8 support) returns (bool)',
    'function propose(string memory description) returns (uint256)',
    'event VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight)',
  ]
};

/**
 * VIBE Token Functions Interface
 */
export interface VIBETokenFunctions {
  // Token operations
  transfer(to: string, amount: number): Promise<any>;
  approve(spender: string, amount: number): Promise<any>;
  balanceOf(address: string): Promise<number>;
  
  // Staking operations
  stake(amount: number, venueAddress: string): Promise<any>;
  unstake(amount: number): Promise<any>;
  claimRewards(): Promise<number>;
  getStakeBalance(userAddress: string, venueAddress: string): Promise<number>;
  getPendingRewards(userAddress: string): Promise<number>;
  
  // Governance
  delegate(delegatee: string): Promise<any>;
  getVotes(address: string): Promise<number>;
  castVote(proposalId: number, support: 0 | 1 | 2): Promise<any>;
}

/**
 * Token Balance Interface
 */
export interface TokenBalance {
  balance: number;
  stakedBalance: number;
  pendingRewards: number;
  totalValue: number;
}

/**
 * Staking Position Interface
 */
export interface StakingPosition {
  amount: number;
  venueId: string;
  venueName: string;
  startTime: Date;
  lockEndTime: Date;
  pendingRewards: number;
  multiplier: number;
}

/**
 * Earn VIBE Tokens Actions
 */
export const EARN_VIBE_ACTIONS = {
  verifiedCheckin: {
    amount: 10,
    description: 'Verified venue check-in',
    cooldown: 24 * 60 * 60, // 24 hours
  },
  qualityReview: {
    amount: 50,
    description: 'Submit quality review (>100 chars with photo)',
    cooldown: 7 * 24 * 60 * 60, // 7 days
  },
  referral: {
    amount: 100,
    description: 'Refer a new user who joins',
    cooldown: 0,
  },
  socialShare: {
    amount: 5,
    description: 'Share check-in to social media',
    cooldown: 24 * 60 * 60, // 24 hours
  },
  firstVisit: {
    amount: 25,
    description: 'First visit to a new venue',
    cooldown: 0,
  },
  venueLoyalty: {
    amount: 5,
    description: 'Visit same venue 5+ times',
    cooldown: 0,
    requirement: 5,
  },
  weekendVibes: {
    amount: 15,
    description: 'Check-in on weekend nights (Fri-Sat)',
    cooldown: 7 * 24 * 60 * 60,
  },
  vipEvent: {
    amount: 30,
    description: 'Attend VIP event or special party',
    cooldown: 30 * 24 * 60 * 60,
  },
};

/**
 * Spend VIBE Tokens Actions
 */
export const SPEND_VIBE_ACTIONS = {
  bookingDeposit: {
    cost: 50,
    description: 'Cover booking deposit',
  },
  vipUpgrade: {
    cost: 100,
    description: 'VIP table upgrade',
  },
  bottleReservation: {
    cost: 200,
    description: 'Priority bottle service reservation',
  },
  merchandise: {
    cost: 500,
    description: 'Exclusive NightLife merchandise',
  },
  privateRoom: {
    cost: 1000,
    description: 'Private room booking',
  },
  exclusiveEvent: {
    cost: 500,
    description: 'Access exclusive member events',
  },
  skipLine: {
    cost: 25,
    description: 'Skip the line pass',
  },
  freeEntry: {
    cost: 20,
    description: 'Free entry to participating venues',
  },
};

/**
 * Gas Optimization Settings
 */
export const GAS_OPTIMIZATION = {
  network: 'polygon', // L2 solution for <$0.01 fees
  batchTransactions: true,
  useMetaTransactions: true,
  estimateGas: true,
  gasLimitBuffer: 1.1, // 10% buffer
  maxFeePerGas: '0.00000001', // 10 gwei max
  priorityFee: '0.000000001', // 1 gwei priority
};

/**
 * Web3 Error Types
 */
export class Web3Error extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'Web3Error';
  }
}

export class TokenInsufficientBalance extends Web3Error {
  constructor(balance: number, required: number) {
    super(
      `Insufficient balance: ${balance} required ${required}`,
      'INSUFFICIENT_BALANCE',
      { balance, required }
    );
    this.name = 'TokenInsufficientBalance';
  }
}

export class TransactionRejected extends Web3Error {
  constructor(reason: string) {
    super(`Transaction rejected: ${reason}`, 'TRANSACTION_REJECTED', { reason });
    this.name = 'TransactionRejected';
  }
}

export class StakingLockPeriodActive extends Web3Error {
  constructor(unlockTime: Date) {
    super(
      `Staking locked until ${unlockTime.toISOString()}`,
      'STAKING_LOCKED',
      { unlockTime }
    );
    this.name = 'StakingLockPeriodActive';
  }
}
