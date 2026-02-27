/**
 * NFT PASS CONTRACT
 * Phase 8: Web3 & Decentralized Vibe Economy
 * 
 * Concept: Elite Access Passes as NFTs with royalty system
 * Standard: ERC-721 + ERC-2981 (NFT Royalty)
 * 
 * Features:
 * - Limited edition venue passes
 * - Automatic royalty distribution on secondary sales
 * - Utility: Skip line, table upgrades, private rooms
 * - Soulbound options for tier-locked passes
 */

export const NFT_PASS_CONFIG = {
  name: 'NightLife Elite Pass',
  symbol: 'NL-PASS',
  network: 'polygon',
  chainId: 137,
  
  // Royalty configuration
  royalty: {
    // Who receives royalties
    recipients: {
      platform: 5,    // 5% to platform
      venue: 5,       // 5% to venue (additional)
    },
    maxRoyalty: 10, // Max 10% combined
    minRoyalty: 2,   // Min 2%
  },
  
  // Pass tiers
  tiers: {
    black: {
      name: 'The Black Card',
      maxSupply: 100,
      price: 500, // USD equivalent in MATIC
      royalty: 10,
      utilities: [
        { id: 'unlimited_entry', name: 'Unlimited Free Entry', description: 'Always free entry to venue' },
        { id: 'skip_line', name: 'Skip the Line', description: 'Never wait in queue' },
        { id: 'table_upgrade', name: 'Free Table Upgrade', description: 'Automatic VIP table upgrade' },
        { id: 'private_room', name: 'Private Room Access', description: 'Access to exclusive private rooms' },
        { id: 'guest_pass', name: '3 Free Guests', description: 'Bring 3 guests free monthly' },
        { id: 'priority_booking', name: 'Priority Booking', description: 'Book tables before public' },
      ],
      color: '#000000',
      gradient: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)',
    },
    gold: {
      name: 'Gold Pass',
      maxSupply: 500,
      price: 200,
      royalty: 8,
      utilities: [
        { id: 'monthly_entry', name: '4 Free Entries Monthly', description: '4x free entry per month' },
        { id: 'skip_line', name: 'Skip the Line', description: 'Fast-track entry' },
        { id: 'table_discount', name: '20% Table Discount', description: '20% off bottle service' },
        { id: 'guest_pass', name: '1 Free Guest', description: '1 free guest monthly' },
      ],
      color: '#FFD700',
      gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    },
    silver: {
      name: 'Silver Pass',
      maxSupply: 2000,
      price: 75,
      royalty: 5,
      utilities: [
        { id: 'monthly_entry', name: '2 Free Entries Monthly', description: '2x free entry per month' },
        { id: 'priority_queue', name: 'Priority Queue', description: 'Skip general queue' },
        { id: 'table_discount', name: '10% Table Discount', description: '10% off bottle service' },
      ],
      color: '#C0C0C0',
      gradient: 'linear-gradient(135deg, #C0C0C0 0%, #A9A9A9 100%)',
    },
    bronze: {
      name: 'Bronze Pass',
      maxSupply: 10000,
      price: 25,
      royalty: 3,
      utilities: [
        { id: 'monthly_entry', name: '1 Free Entry Monthly', description: '1x free entry per month' },
        { id: 'loyalty_points', name: '2x Loyalty Points', description: 'Earn double VIBE tokens' },
      ],
      color: '#CD7F32',
      gradient: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)',
    },
  },
  
  // Sale phases
  phases: {
    whitelist: {
      duration: 3 * 24 * 60 * 60, // 3 days
      discount: 0.2, // 20% off
      maxPerWallet: 2,
    },
    public: {
      duration: 7 * 24 * 60 * 60, // 7 days
      maxPerWallet: 5,
    },
    secondary: {
      // After initial sale, traded on secondary market
      marketplaceFee: 2.5, // 2.5% to marketplace
    }
  },
  
  // Utility redemption
  redemption: {
    cooldown: 30 * 24 * 60 * 60, // 30 days between redemptions for same utility
    maxRedemptions: {
      unlimited_entry: 999,
      monthly_entry: 12, // Per year
      skip_line: 52, // Weekly
      table_upgrade: 12, // Monthly
      private_room: 4, // Quarterly
      guest_pass: 12, // Monthly
      priority_booking: 24, // Bi-monthly
    }
  }
};

/**
 * NFT Pass ABI Fragments
 */
export const NFT_PASS_ABI = {
  // ERC-721 Standard
  erc721: [
    'function mint(address to, string tokenURI) returns (uint256)',
    'function burn(uint256 tokenId)',
    'function transferFrom(address from, address to, uint256 tokenId)',
    'function safeTransferFrom(address from, address to, uint256 tokenId)',
    'function ownerOf(uint256 tokenId) view returns (address)',
    'function balanceOf(address owner) view returns (uint256)',
    'function tokenURI(uint256 tokenId) view returns (string)',
    'function totalSupply() view returns (uint256)',
  ],
  
  // ERC-2981 Royalty
  royalty: [
    'function setDefaultRoyalty(address receiver, uint96 feeNumerator)',
    'function setTokenRoyalty(uint256 tokenId, address receiver, uint96 feeNumerator)',
    'function royaltyInfo(uint256 tokenId, uint256 salePrice) view returns (address receiver, uint256 royaltyAmount)',
  ],
  
  // Pass-specific
  pass: [
    'function mintWithPhase(address to, uint256 phaseId, string tokenURI, uint256 quantity) returns (uint256)',
    'function redeemUtility(uint256 tokenId, bytes32 utilityId) returns (bool)',
    'function getUtilityRedemptions(uint256 tokenId, bytes32 utilityId) view returns (uint256)',
    'function getNextRedemptionTime(uint256 tokenId, bytes32 utilityId) view returns (uint256)',
    'function setSoulbound(bool soulbound)',
    'function isSoulbound(uint256 tokenId) view returns (bool)',
    'function getPassTier(uint256 tokenId) view returns (uint8)',
    'event UtilityRedeemed(uint256 indexed tokenId, bytes32 utilityId, uint256 timestamp)',
    'event RoyaltyPaid(address indexed receiver, uint256 tokenId, uint256 amount)',
  ],
  
  // Marketplace
  marketplace: [
    'function listForSale(uint256 tokenId, uint256 price)',
    'function cancelSale(uint256 tokenId)',
    'function buyFromSale(uint256 tokenId) payable',
    'function makeOffer(uint256 tokenId, uint256 price, uint256 duration)',
    'function acceptOffer(uint256 tokenId, uint256 offerId)',
    'event Listed(uint256 indexed tokenId, address seller, uint256 price)',
    'event Sold(uint256 indexed tokenId, address seller, address buyer, uint256 price)'
  ]
};

/**
 * NFT Pass Data Interface
 */
export interface NFTPassData {
  tokenId: number;
  owner: string;
  venueId: string;
  tier: 'black' | 'gold' | 'silver' | 'bronze';
  mintPrice: number;
  mintTimestamp: Date;
  isSoulbound: boolean;
  isActive: boolean;
  utilities: {
    id: string;
    redeemed: number;
    lastRedeemed?: Date;
  }[];
}

/**
 * Pass Tier Interface
 */
export interface PassTier {
  name: string;
  maxSupply: number;
  currentSupply: number;
  price: number;
  royalty: number;
  utilities: {
    id: string;
    name: string;
    description: string;
  }[];
  color: string;
  gradient: string;
}

/**
 * Secondary Sale Interface
 */
export interface SecondarySale {
  tokenId: number;
  seller: string;
  buyer: string;
  price: number;
  royaltyAmount: number;
  platformFee: number;
  venueFee: number;
  timestamp: Date;
  transactionHash: string;
}

/**
 * Utility Redemption Interface
 */
export interface UtilityRedemption {
  tokenId: number;
  utilityId: string;
  redeemedAt: Date;
  transactionHash: string;
}

/**
 * Generate pass metadata
 */
export function generatePassMetadata(
  tier: keyof typeof NFT_PASS_CONFIG.tiers,
  venueId: string,
  venueName: string,
  passNumber: number
): Record<string, any> {
  const tierConfig = NFT_PASS_CONFIG.tiers[tier];
  
  return {
    name: `${venueName} ${tierConfig.name}`,
    description: `Exclusive access pass for ${venueName}. ${tierConfig.utilities.map(u => u.name).join(', ')}.`,
    image: `https://api.nightlife.id/passes/${tier}/${venueId}.png`,
    attributes: [
      { trait_type: 'Tier', value: tierConfig.name },
      { trait_type: 'Venue ID', value: venueId },
      { trait_type: 'Pass Number', value: passNumber },
      { trait_type: 'Utility Count', value: tierConfig.utilities.length },
      { trait_type: 'Max Supply', value: tierConfig.maxSupply },
    ],
    properties: {
      tier,
      venueId,
      utilities: tierConfig.utilities,
    }
  };
}

/**
 * Calculate royalty for secondary sale
 */
export function calculateRoyalty(
  salePrice: number,
  tier: keyof typeof NFT_PASS_CONFIG.tiers
): {
  totalRoyalty: number;
  platformFee: number;
  venueFee: number;
  marketplaceFee: number;
  sellerReceives: number;
} {
  const tierConfig = NFT_PASS_CONFIG.tiers[tier];
  const { royalty, phases } = NFT_PASS_CONFIG;
  
  const totalRoyalty = salePrice * (tierConfig.royalty / 100);
  const platformFee = salePrice * (royalty.recipients.platform / 100);
  const venueFee = salePrice * (royalty.recipients.venue / 100);
  const marketplaceFee = salePrice * (phases.secondary.marketplaceFee / 100);
  const sellerReceives = salePrice - totalRoyalty - marketplaceFee;
  
  return {
    totalRoyalty,
    platformFee,
    venueFee,
    marketplaceFee,
    sellerReceives
  };
}

/**
 * Check if utility can be redeemed
 */
export function canRedeemUtility(
  utilityId: string,
  tier: keyof typeof NFT_PASS_CONFIG.tiers,
  redeemedCount: number,
  lastRedeemedAt?: Date
): { canRedeem: boolean; nextRedemptionTime?: Date; reason?: string } {
  const tierConfig = NFT_PASS_CONFIG.tiers[tier];
  const utility = tierConfig.utilities.find(u => u.id === utilityId);
  
  if (!utility) {
    return { canRedeem: false, reason: 'Utility not available for this pass tier' };
  }
  
  const maxRedemptions = NFT_PASS_CONFIG.redemption.maxRedemptions[utilityId as keyof typeof NFT_PASS_CONFIG.redemption.maxRedemptions] || 0;
  
  if (redeemedCount >= maxRedemptions) {
    return { canRedeem: false, reason: `Maximum redemptions (${maxRedemptions}) reached for this utility` };
  }
  
  if (lastRedeemedAt) {
    const cooldownMs = NFT_PASS_CONFIG.redemption.cooldown * 1000;
    const nextRedemptionTime = new Date(lastRedeemedAt.getTime() + cooldownMs);
    
    if (Date.now() < nextRedemptionTime.getTime()) {
      return { canRedeem: false, nextRedemptionTime, reason: 'Cooldown period active' };
    }
  }
  
  return { canRedeem: true };
}
