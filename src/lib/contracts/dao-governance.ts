/**
 * DAO GOVERNANCE CONTRACT
 * Phase 8: Web3 & Decentralized Vibe Economy
 * 
 * Concept: Decentralized governance for platform decisions
 * Standard: Governor Bravo / OpenZeppelin Governor
 * 
 * Features:
 * - Voting power based on token holdings + tier
 * - Proposal creation for platform decisions
 * - Delegated voting
 * - Quadratic voting for fairness
 * - Time-locked execution
 */

export const DAO_CONFIG = {
  name: 'NightLife DAO',
  network: 'polygon',
  chainId: 137,
  
  // Governance parameters
  governance: {
    // Voting delays
    votingDelay: 1 * 24 * 60 * 60, // 1 day after proposal
    votingPeriod: 3 * 24 * 60 * 60, // 3 days voting
    
    // Proposal thresholds
    proposalThreshold: 100000, // 100k VIBE tokens
    quorumThreshold: 500000,    // 500k VIBE tokens (4% of supply)
    
    // Execution
    timelockDelay: 2 * 24 * 60 * 60, // 2 day timelock
    
    // Limits
    maxProposals: 50,
    maxActionsPerProposal: 10,
  },
  
  // Voting power by tier
  tierMultiplier: {
    bronze: 1,
    silver: 2,
    gold: 4,
    platinum: 8,
    diamond: 16,
  },
  
  // Proposal types
  proposalTypes: {
    cityExpansion: {
      id: 'city_expansion',
      name: 'City Expansion',
      description: 'Decide which new city to expand to',
      requiresQuorum: 0.04, // 4%
      requiresMajority: 0.5, // 50%
    },
    djOfMonth: {
      id: 'dj_of_month',
      name: 'DJ of the Month',
      description: 'Vote for featured DJ',
      requiresQuorum: 0.02, // 2%
      requiresMajority: 0.5,
    },
    featureProposal: {
      id: 'feature_proposal',
      name: 'Platform Feature',
      description: 'Propose new platform features',
      requiresQuorum: 0.03, // 3%
      requiresMajority: 0.5,
    },
    rewardDistribution: {
      id: 'reward_distribution',
      name: 'Reward Distribution',
      description: 'Allocate rewards pool funds',
      requiresQuorum: 0.05, // 5%
      requiresMajority: 0.6, // 60%
    },
    partnership: {
      id: 'partnership',
      name: 'Strategic Partnership',
      description: 'Approve new brand partnerships',
      requiresQuorum: 0.06, // 6%
      requiresMajority: 0.65,
    },
    parameterChange: {
      id: 'parameter_change',
      name: 'Parameter Change',
      description: 'Modify protocol parameters',
      requiresQuorum: 0.08, // 8%
      requiresMajority: 0.7, // 70%
    },
  },
  
  // Council members (founders/early supporters)
  council: {
    minTokens: 1000000, // 1M VIBE for council
    maxCouncilSize: 12,
    termLength: 365 * 24 * 60 * 60, // 1 year
  },
  
  // Rewards for participation
  incentives: {
    proposalCreator: 1000, // VIBE tokens
    voter: 10, // Per vote
    delegator: 50, // Per delegation
  }
};

/**
 * DAO ABI Fragments
 */
export const DAO_ABI = {
  // Governor
  governor: [
    'function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) returns (uint256)',
    'function execute(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) payable returns (uint256)',
    'function castVote(uint256 proposalId, uint8 support) returns (uint256)',
    'function castVoteWithReason(uint256 proposalId, uint8 support, string reason) returns (uint256)',
    'function castVoteBySig(uint256 proposalId, uint8 support, uint8 v, bytes32 r, bytes32 s) returns (uint256)',
    'function cancel(uint256 proposalId) returns (uint256)',
    'function queue(uint256 proposalId) returns (uint256)',
    'function state(uint256 proposalId) view returns (uint8)',
    'function votingDelay() view returns (uint256)',
    'function votingPeriod() view returns (uint256)',
    'function quorum(blockNumber) view returns (uint256)',
    'function proposalThreshold() view returns (uint256)',
    'function proposalVotes(uint256 proposalId) view returns (uint256 forVotes, uint256 againstVotes, uint256 abstainVotes)',
    'event ProposalCreated(uint256 id, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)',
    'event VoteCast(address voter, uint256 proposalId, uint8 support, uint256 weight, string reason)',
    'event ProposalExecuted(uint256 id)',
    'event ProposalQueued(uint256 id, uint256 eta)',
  ],
  
  // Timelock
  timelock: [
    'function schedule(address target, uint256 value, bytes calldata, bytes32 predecessor, bytes32 salt, uint256 delay) returns (bytes32)',
    'function execute(address target, uint256 value, bytes calldata, bytes32 predecessor, bytes32 salt) payable returns (bytes32)',
    'function cancel(bytes32 txHash)',
    'function isOperation(bytes32 id) view returns (bool)',
    'function isOperationReady(bytes32 id) view returns (bool)',
    'function isOperationDone(bytes32 id) view returns (bool)',
    'function getTimestamp(bytes32 id) view returns (uint256)',
    'event CallScheduled(bytes32 indexed id, uint256 indexed index, address target, uint256 value, bytes data, bytes32 predecessor, uint256 delay)',
    'event CallExecuted(bytes32 indexed id, uint256 indexed index, address target, uint256 value, bytes data)',
    'event Cancelled(bytes32 indexed id)',
  ],
  
  // Token
  token: [
    'function delegate(address delegatee)',
    'function delegateBySig(address delegatee, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s)',
    'function getVotes(address account) view returns (uint256)',
    'function getPastVotes(address account, uint256 blockNumber) view returns (uint256)',
    'function getPastTotalSupply(uint256 blockNumber) view returns (uint256)',
    'function nonces(address owner) view returns (uint256)',
  ]
};

/**
 * Proposal Data Interface
 */
export interface ProposalData {
  id: number;
  proposer: string;
  title: string;
  description: string;
  proposalType: keyof typeof DAO_CONFIG.proposalTypes;
  targets: string[];
  values: number[];
  calldatas: string[];
  status: 'pending' | 'active' | 'queued' | 'executed' | 'defeated' | 'canceled';
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  startBlock: number;
  endBlock: number;
  executionTime?: Date;
  createdAt: Date;
}

/**
 * Vote Data Interface
 */
export interface VoteData {
  proposalId: number;
  voter: string;
  support: 0 | 1 | 2; // Against, For, Abstain
  weight: number;
  reason?: string;
  timestamp: Date;
}

/**
 * Voting Power Calculation
 */
export function calculateVotingPower(
  vibeBalance: number,
  stakedBalance: number,
  tier: keyof typeof DAO_CONFIG.tierMultiplier
): number {
  const tierMultiplier = DAO_CONFIG.tierMultiplier[tier];
  
  // Base: token balance
  const basePower = vibeBalance;
  
  // Staked tokens get 1.5x multiplier
  const stakedPower = stakedBalance * 1.5;
  
  // Apply tier multiplier
  const totalPower = (basePower + stakedPower) * tierMultiplier;
  
  return Math.floor(totalPower);
}

/**
 * Check if address meets proposal threshold
 */
export function canCreateProposal(
  vibeBalance: number,
  stakedBalance: number,
  tier: keyof typeof DAO_CONFIG.tierMultiplier
): boolean {
  const votingPower = calculateVotingPower(vibeBalance, stakedBalance, tier);
  return votingPower >= DAO_CONFIG.governance.proposalThreshold;
}

/**
 * Check if proposal meets quorum
 */
export function checkQuorum(
  proposal: ProposalData,
  totalSupply: number
): boolean {
  const totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
  const quorumRequired = totalSupply * 0.04; // 4% quorum
  
  return totalVotes >= quorumRequired;
}

/**
 * Check if proposal passed
 */
export function checkProposalPassed(
  proposal: ProposalData
): boolean {
  const totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
  
  // Simple majority
  if (proposal.forVotes > proposal.againstVotes) {
    // Check quorum
    return proposal.forVotes >= DAO_CONFIG.governance.quorumThreshold;
  }
  
  return false;
}

/**
 * Quadratic Voting Calculation
 * Reduces influence of whale voters
 */
export function calculateQuadraticVotes(
  votes: number,
  votingPower: number
): number {
  return Math.floor(Math.sqrt(votes * votingPower));
}

/**
 * Proposal State
 */
export enum ProposalState {
  Pending = 0,
  Active = 1,
  Canceled = 2,
  Defeated = 3,
  Succeeded = 4,
  Queued = 5,
  Expired = 6,
  Executed = 7,
}

/**
 * Vote Type
 */
export enum VoteType {
  Against = 0,
  For = 1,
  Abstain = 2,
}

/**
 * Delegation Info
 */
export interface DelegationInfo {
  delegator: string;
  delegatee: string;
  votingPower: number;
  delegatedAt: Date;
}

/**
 * Council Member
 */
export interface CouncilMember {
  address: string;
  name: string;
  termStart: Date;
  termEnd: Date;
  votingPower: number;
  proposalsCreated: number;
  votesCast: number;
}
