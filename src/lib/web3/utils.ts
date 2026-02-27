/**
 * WEB3 UTILITIES
 * Phase 8: Web3 & Decentralized Vibe Economy
 * 
 * Utilities:
 * - Account Abstraction (Smart Wallets)
 * - Zero-Knowledge Proof helpers
 * - Gas optimization helpers
 * - Wallet connection helpers
 */

import { 
  CONTRACT_ADDRESSES, 
  NETWORK_CONFIG, 
  DEFAULT_WALLET_STATE,
  WalletState 
} from '@/lib/contracts';

/**
 * Account Abstraction Configuration
 * Enables Web2-style onboarding with Web3 capabilities
 */
export const AA_CONFIG = {
  // Entry Point Contract
  entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
  
  // Factory (for creating smart wallets)
  factory: '0x9406Cc6185a346906296840746125a0E44976454',
  
  // Paymaster (for gasless transactions)
  paymaster: '0x...', // Will be deployed
  
  // Supported tokens for gas sponsorship
  erc20Tokens: {
    usdc: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // Polygon USDC
    usdt: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // Polygon USDT
  },
  
  // Smart wallet settings
  wallet: {
    salt: 'nightlife-v1',
    initialThreshold: 1, // Single owner
    guardians: [], // Optional social recovery
  },
};

/**
 * Zero-Knowledge Proof Configuration
 */
export const ZKP_CONFIG = {
  // Circuit paths (compiled circom/snarkjs)
  circuits: {
    ageVerification: '/circuits/age_verification.wasm',
    tierVerification: '/circuits/tier_verification.wasm',
    residenceVerification: '/circuits/residence_verification.wasm',
  },
  
  // Proof verification keys
  verificationKeys: {
    ageVerification: '/circuits/age_verification_vk.json',
    tierVerification: '/circuits/tier_verification_vk.json',
    residenceVerification: '/circuits/residence_verification_vk.json',
  },
  
  // Proof generation settings
  prove: {
    wasm: '/circuits/prover.wasm',
    zkey: '/circuits/prover.zkey',
  },
};

/**
 * Generate Account Abstraction wallet address
 * Uses CREATE2 deterministic deployment
 */
export async function generateSmartWalletAddress(
  ownerAddress: string,
  salt?: string
): Promise<string> {
  // In production, this would use ethers.js to compute the address
  // For now, return a deterministic address based on owner
  const saltValue = salt || AA_CONFIG.wallet.salt;
  const encoded = ethers.utils.defaultAbiCoder.encode(
    ['address', 'bytes32'],
    [ownerAddress, ethers.utils.keccak256(ethers.utils.toUtf8Bytes(saltValue))]
  );
  
  // This is a simplified version - real implementation would use CREATE2
  const hash = ethers.utils.keccak256(encoded);
  return '0x' + hash.slice(26); // Last 20 bytes
}

/**
 * Create user operation for smart wallet
 */
export interface UserOperation {
  sender: string;
  nonce: number;
  initCode: string;
  callData: string;
  callGasLimit: number;
  verificationGasLimit: number;
  preVerificationGas: number;
  maxFeePerGas: number;
  maxPriorityFeePerGas: number;
  paymasterAndData: string;
  signature: string;
}

/**
 * Build user operation for token transfer
 */
export function buildTokenTransferOp(
  walletAddress: string,
  to: string,
  amount: string,
  tokenAddress: string,
  nonce: number
): Partial<UserOperation> {
  const callData = ethers.utils.defaultAbiCoder.encode(
    ['address', 'address', 'uint256'],
    [tokenAddress, to, amount]
  );
  
  return {
    sender: walletAddress,
    nonce,
    callData,
    callGasLimit: 50000,
    verificationGasLimit: 100000,
    preVerificationGas: 21000,
    maxFeePerGas: ethers.utils.parseUnits('100', 'gwei'),
    maxPriorityFeePerGas: ethers.utils.parseUnits('2', 'gwei'),
    paymasterAndData: '0x',
  };
}

/**
 * Verify ZK proof locally
 */
export async function verifyZKP(
  proof: {
    a: [string, string];
    b: [[string, string], [string, string]];
    c: [string, string];
    publicSignals: string[];
  },
  verificationKey: string
): Promise<boolean> {
  // In production, this would use snarkjs to verify the proof
  // For now, return true for demo
  console.log('Verifying ZKP with vk:', verificationKey);
  console.log('Proof:', proof);
  
  // Simulate verification
  return true;
}

/**
 * Generate ZK proof for age verification
 */
export async function generateAgeProof(
  dateOfBirth: string,
  minAge: number = 21
): Promise<{
  proof: any;
  publicSignals: string[];
}> {
  // In production, this would use circom/snarkjs circuits
  // For now, return mock proof
  const birthYear = new Date(dateOfBirth).getFullYear();
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;
  
  return {
    proof: {
      a: ['0x1', '0x2'],
      b: [['0x3', '0x4'], ['0x5', '0x6']],
      c: ['0x7', '0x8'],
      publicSignals: [age >= minAge ? '1' : '0'],
    },
    publicSignals: [age >= minAge ? '1' : '0'],
  };
}

/**
 * Generate ZK proof for tier verification
 */
export async function generateTierProof(
  currentTier: string,
  requiredTier: string = 'platinum'
): Promise<{
  proof: any;
  publicSignals: string[];
}> {
  const tierLevels: Record<string, number> = {
    bronze: 1,
    silver: 2,
    gold: 3,
    platinum: 4,
    diamond: 5,
  };
  
  const currentLevel = tierLevels[currentTier] || 0;
  const requiredLevel = tierLevels[requiredTier] || 0;
  
  return {
    proof: {
      a: ['0x1', '0x2'],
      b: [['0x3', '0x4'], ['0x5', '0x6']],
      c: ['0x7', '0x8'],
      publicSignals: [currentLevel >= requiredLevel ? '1' : '0'],
    },
    publicSignals: [currentLevel >= requiredLevel ? '1' : '0'],
  };
}

/**
 * Gas estimation helpers
 */
export const GAS_UTILS = {
  // Estimate gas with buffer
  estimateWithBuffer: (estimate: number, buffer: number = 1.1): number => {
    return Math.floor(estimate * buffer);
  },
  
  // Get current gas prices
  getGasPrices: async (): Promise<{
    low: string;
    standard: string;
    fast: string;
  }> => {
    // In production, fetch from network
    return {
      low: ethers.utils.formatUnits('30', 'gwei'),
      standard: ethers.utils.formatUnits('50', 'gwei'),
      fast: ethers.utils.formatUnits('100', 'gwei'),
    };
  },
  
  // Calculate max fee
  calculateMaxFee: (
    gasLimit: number,
    maxFeePerGas: string,
    maxPriorityFeePerGas: string
  ): string => {
    const baseFee = ethers.utils.parseUnits(maxFeePerGas, 'gwei');
    const priorityFee = ethers.utils.parseUnits(maxPriorityFeePerGas, 'gwei');
    const maxFee = baseFee.add(priorityFee);
    return ethers.utils.formatUnits(maxFee.mul(gasLimit), 'ether');
  },
};

/**
 * Format address for display
 */
export function formatAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format token amount
 */
export function formatTokenAmount(
  amount: string | number,
  decimals: number = 18
): string {
  const parsed = typeof amount === 'string' 
    ? ethers.utils.formatUnits(amount, decimals)
    : amount.toFixed(decimals);
  return parsed;
}

/**
 * Parse token amount
 */
export function parseTokenAmount(
  amount: string,
  decimals: number = 18
): string {
  return ethers.utils.parseUnits(amount, decimals).toString();
}

/**
 * Get ethers.js provider for network
 */
export function getProvider(chainId: number = 137) {
  const network = Object.values(NETWORK_CONFIG).find(n => n.chainId === chainId);
  if (!network) throw new Error('Network not supported');
  
  return new ethers.providers.JsonRpcProvider(network.rpc);
}

/**
 * Wallet connection error types
 */
export class WalletConnectionError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'WalletConnectionError';
  }
}

export class UnsupportedChainError extends WalletConnectionError {
  constructor(chainId: number) {
    super(
      `Chain ${chainId} is not supported. Please switch to Polygon.`,
      'UNSUPPORTED_CHAIN',
      { chainId }
    );
    this.name = 'UnsupportedChainError';
  }
}

export class UserRejectedError extends WalletConnectionError {
  constructor() {
    super('User rejected connection request', 'USER_REJECTED');
    this.name = 'UserRejectedError';
  }
}

// Note: In a real implementation, ethers would be imported
// For this TypeScript-only file, we're defining the interfaces
declare const ethers: any;
