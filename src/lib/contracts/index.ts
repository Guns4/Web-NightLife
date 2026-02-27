/**
 * CONTRACTS INDEX
 * Phase 8: Web3 & Decentralized Vibe Economy
 * 
 * Export all smart contract configurations and utilities
 */

export * from './vibe-token';
export * from './soulbound-token';
export * from './nft-pass';
export * from './revenue-split';
export * from './dao-governance';

/**
 * Network Configuration
 */
export const NETWORK_CONFIG = {
  // Polygon Mainnet
  polygon: {
    chainId: 137,
    name: 'Polygon',
    rpc: 'https://polygon-rpc.com',
    explorer: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    // Block times
    blockTime: 2, // seconds
  },
  
  // Mumbai Testnet
  mumbai: {
    chainId: 80001,
    name: 'Mumbai',
    rpc: 'https://rpc-mumbai.maticvigil.com',
    explorer: 'https://mumbai.polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    blockTime: 2,
  },
  
  // Base (for future expansion)
  base: {
    chainId: 8453,
    name: 'Base',
    rpc: 'https://mainnet.base.org',
    explorer: 'https://basescan.org',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    blockTime: 2,
  },
};

/**
 * Get network config by chain ID
 */
export function getNetworkConfig(chainId: number) {
  const networks = Object.values(NETWORK_CONFIG);
  return networks.find(n => n.chainId === chainId) || NETWORK_CONFIG.polygon;
}

/**
 * Contract Deployment Status
 */
export const CONTRACT_DEPLOYMENT = {
  vibeToken: {
    address: process.env.NEXT_PUBLIC_VIBE_TOKEN_ADDRESS || '',
    deployed: !!process.env.NEXT_PUBLIC_VIBE_TOKEN_ADDRESS,
  },
  soulboundToken: {
    address: process.env.NEXT_PUBLIC_SBT_ADDRESS || '',
    deployed: !!process.env.NEXT_PUBLIC_SBT_ADDRESS,
  },
  nftPass: {
    address: process.env.NEXT_PUBLIC_NFT_PASS_ADDRESS || '',
    deployed: !!process.env.NEXT_PUBLIC_NFT_PASS_ADDRESS,
  },
  revenueSplit: {
    address: process.env.NEXT_PUBLIC_REVENUE_SPLIT_ADDRESS || '',
    deployed: !!process.env.NEXT_PUBLIC_REVENUE_SPLIT_ADDRESS,
  },
  dao: {
    address: process.env.NEXT_PUBLIC_DAO_ADDRESS || '',
    deployed: !!process.env.NEXT_PUBLIC_DAO_ADDRESS,
  },
};

/**
 * Gas Estimates for common operations
 */
export const GAS_ESTIMATES = {
  // Token operations
  tokenTransfer: 65000,
  tokenApprove: 50000,
  
  // NFT operations
  nftMint: 150000,
  nftTransfer: 85000,
  nftBurn: 50000,
  
  // Staking
  stake: 120000,
  unstake: 100000,
  claimRewards: 80000,
  
  // Governance
  createProposal: 300000,
  castVote: 80000,
  executeProposal: 200000,
  
  // Revenue split
  splitPayment: 180000,
  withdraw: 60000,
};

/**
 * All supported chains
 */
export const SUPPORTED_CHAINS = [
  NETWORK_CONFIG.polygon.chainId,
  NETWORK_CONFIG.mumbai.chainId,
  NETWORK_CONFIG.base.chainId,
];

/**
 * Check if chain is supported
 */
export function isChainSupported(chainId: number): boolean {
  return SUPPORTED_CHAINS.includes(chainId);
}

/**
 * Wallet connection status
 */
export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  balance: string | null;
}

/**
 * Default wallet state
 */
export const DEFAULT_WALLET_STATE: WalletState = {
  isConnected: false,
  address: null,
  chainId: null,
  balance: null,
};
