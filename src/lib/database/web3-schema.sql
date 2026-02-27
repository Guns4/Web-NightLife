-- ============================================
-- PHASE 8: WEB3 & DECENTRALIZED VIBE ECONOMY
-- Database Schema for Blockchain Integration
-- ============================================

-- ============================================
-- SECTION 1: DECENTRALIZED IDENTITY (DID) & SOULBOUND TOKENS
-- ============================================

-- Table: Decentralized Identifiers (DID)
-- Stores DID documents for users
CREATE TABLE IF NOT EXISTS decentralized_identifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- DID Information
  did TEXT UNIQUE NOT NULL, -- did:nl:0x...
  wallet_address TEXT UNIQUE NOT NULL,
  chain_id INTEGER DEFAULT 137, -- Polygon
  
  -- On-chain SBT data
  sbt_token_id UUID REFERENCES soulbound_tokens(id) ON DELETE SET NULL,
  reputation_score INTEGER DEFAULT 0,
  reputation_tier TEXT DEFAULT 'newcomer' CHECK (reputation_tier IN ('newcomer', 'regular', 'influencer', 'vip', 'legend')),
  
  -- Verification status
  is_verified BOOLEAN DEFAULT false,
  verification_level TEXT DEFAULT 'none', -- 'none', 'email', 'phone', 'kyc'
  
  -- ZKP verifications
  zkp_verifications JSONB DEFAULT '{}',
  
  -- DID Document (stored as JSON)
  did_document JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_did_user ON decentralized_identifiers(user_id);
CREATE INDEX idx_did_wallet ON decentralized_identifiers(wallet_address);
CREATE INDEX idx_did_reputation ON decentralized_identifiers(reputation_score DESC);

-- Table: Soulbound Tokens (SBT)
-- Stores on-chain SBT data
CREATE TABLE IF NOT EXISTS soulbound_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Token identification
  token_id INTEGER NOT NULL,
  contract_address TEXT NOT NULL,
  transaction_hash TEXT UNIQUE NOT NULL,
  
  -- On-chain data
  token_uri TEXT,
  metadata JSONB,
  
  -- Reputation
  reputation_score INTEGER DEFAULT 0,
  total_points_earned INTEGER DEFAULT 0,
  
  -- Achievements
  achievements JSONB DEFAULT '[]',
  
  -- Timestamps
  minted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sbt_user ON soulbound_tokens(user_id);
CREATE INDEX idx_sbt_token ON soulbound_tokens(token_id);

-- Table: Achievements
-- Track user achievements (on-chain and off-chain)
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Achievement data
  achievement_id TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  achievement_type TEXT NOT NULL, -- 'checkin', 'review', 'referral', 'social', 'milestone'
  description TEXT,
  icon TEXT,
  
  -- Points
  points_awarded INTEGER DEFAULT 0,
  
  -- Progress tracking
  progress_current INTEGER DEFAULT 0,
  progress_required INTEGER DEFAULT 1,
  is_unlocked BOOLEAN DEFAULT false,
  unlocked_at TIMESTAMPTZ,
  
  -- On-chain status
  is_on_chain BOOLEAN DEFAULT false,
  on_chain_transaction TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_achievements_unlocked ON user_achievements(user_id, is_unlocked);

-- Table: ZKP Verifications
-- Store zero-knowledge proof verifications
CREATE TABLE IF NOT EXISTS zkp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Verification type
  verification_type TEXT NOT NULL, -- 'age_21_plus', 'platinum_status', 'resident'
  
  -- Proof data
  proof JSONB NOT NULL,
  public_signals JSONB,
  
  -- Status
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  
  -- Circuit info
  circuit_version TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, verification_type)
);

CREATE INDEX idx_zkp_user ON zkp_verifications(user_id);
CREATE INDEX idx_zkp_type ON zkp_verifications(verification_type);

-- ============================================
-- SECTION 2: NFT PASSES & ROYALTY SYSTEM
-- ============================================

-- Table: NFT Passes
-- Stores NFT passes for venues
CREATE TABLE IF NOT EXISTS nft_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
  
  -- Token identification
  token_id INTEGER NOT NULL,
  contract_address TEXT NOT NULL,
  transaction_hash TEXT UNIQUE NOT NULL,
  
  -- Pass details
  tier TEXT NOT NULL CHECK (tier IN ('black', 'gold', 'silver', 'bronze')),
  name TEXT NOT NULL,
  description TEXT,
  
  -- Supply
  max_supply INTEGER NOT NULL,
  current_supply INTEGER DEFAULT 0,
  
  -- Pricing
  price_matic DECIMAL(18, 2) NOT NULL,
  price_usd DECIMAL(18, 2) NOT NULL,
  
  -- Royalty configuration
  royalty_percentage INTEGER DEFAULT 5,
  
  -- Utilities
  utilities JSONB DEFAULT '[]',
  
  -- Sale phases
  sale_phases JSONB DEFAULT '[]',
  current_phase TEXT DEFAULT 'none',
  
  -- Metadata
  metadata_uri TEXT,
  image_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_soulbound BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nft_passes_venue ON nft_passes(venue_id);
CREATE INDEX idx_nft_passes_tier ON nft_passes(tier);
CREATE INDEX idx_nft_passes_active ON nft_passes(is_active);

-- Table: NFT Pass Ownership
-- Track ownership of NFT passes
CREATE TABLE IF NOT EXISTS nft_pass_ownership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pass_id UUID REFERENCES nft_passes(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Token details
  token_id INTEGER NOT NULL,
  owner_address TEXT NOT NULL,
  
  -- Purchase info
  purchase_price_matic DECIMAL(18, 2),
  purchase_price_usd DECIMAL(18, 2),
  purchase_date TIMESTAMPTZ DEFAULT NOW(),
  transaction_hash TEXT,
  
  -- Current utility redemptions
  utility_redemptions JSONB DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Secondary market
  is_listed_for_sale BOOLEAN DEFAULT false,
  listing_price DECIMAL(18, 2),
  listing_date TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(pass_id, token_id)
);

CREATE INDEX idx_nft_ownership_pass ON nft_pass_ownership(pass_id);
CREATE INDEX idx_nft_ownership_owner ON nft_pass_ownership(owner_id);
CREATE INDEX idx_nft_ownership_listed ON nft_pass_ownership(is_listed_for_sale);

-- Table: NFT Pass Transactions
-- Track all NFT pass transactions (mints, transfers, sales)
CREATE TABLE IF NOT EXISTS nft_pass_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Transaction details
  transaction_hash TEXT UNIQUE NOT NULL,
  block_number BIGINT,
  transaction_type TEXT NOT NULL, -- 'mint', 'transfer', 'sale', 'burn'
  
  -- Pass info
  pass_id UUID REFERENCES nft_passes(id) ON DELETE CASCADE,
  token_id INTEGER NOT NULL,
  
  -- Parties
  from_address TEXT,
  to_address TEXT,
  from_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Sale details
  sale_price_matic DECIMAL(18, 2),
  sale_price_usd DECIMAL(18, 2),
  royalty_amount DECIMAL(18, 2),
  platform_fee DECIMAL(18, 2),
  venue_fee DECIMAL(18, 2),
  marketplace_fee DECIMAL(18, 2),
  
  -- Status
  status TEXT DEFAULT 'confirmed', -- 'pending', 'confirmed', 'failed'
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nft_transactions_hash ON nft_pass_transactions(transaction_hash);
CREATE INDEX idx_nft_transactions_pass ON nft_pass_transactions(pass_id);
CREATE INDEX idx_nft_transactions_token ON nft_pass_transactions(token_id);
CREATE INDEX idx_nft_transactions_type ON nft_pass_transactions(transaction_type);

-- ============================================
-- SECTION 3: TOKENIZED LOYALTY ($VIBE TOKENS)
-- ============================================

-- Table: VIBE Token Balances
-- Track user VIBE token holdings (mirroring on-chain for fast queries)
CREATE TABLE IF NOT EXISTS vibe_token_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Token balance
  balance INTEGER DEFAULT 0,
  locked_balance INTEGER DEFAULT 0, -- For staked tokens
  available_balance INTEGER GENERATED ALWAYS AS (balance - locked_balance) STORED,
  
  -- Staking
  total_staked INTEGER DEFAULT 0,
  
  -- Stats
  total_earned INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  total_staking_rewards INTEGER DEFAULT 0,
  
  -- On-chain sync
  last_synced_block BIGINT,
  last_synced_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vibe_balance_user ON vibe_token_balances(user_id);
CREATE INDEX idx_vibe_balance_total ON vibe_token_balances(balance DESC);

-- Table: VIBE Token Transactions
-- Track all VIBE token transactions
CREATE TABLE IF NOT EXISTS vibe_token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Transaction
  transaction_hash TEXT UNIQUE,
  transaction_type TEXT NOT NULL, -- 'earned', 'spent', 'staked', 'unstaked', 'reward', 'transfer', 'airdrop'
  amount INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  
  -- Context
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  nft_pass_id UUID REFERENCES nft_passes(id) ON DELETE SET NULL,
  reference_id TEXT, -- For linking to other records
  
  -- Description
  description TEXT,
  
  -- On-chain status
  is_on_chain BOOLEAN DEFAULT false,
  on_chain_timestamp TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vibe_transactions_user ON vibe_token_transactions(user_id);
CREATE INDEX idx_vibe_transactions_type ON vibe_token_transactions(transaction_type);
CREATE INDEX idx_vibe_transactions_venue ON vibe_token_transactions(venue_id);
CREATE INDEX idx_vibe_transactions_date ON vibe_token_transactions(created_at DESC);

-- Table: VIBE Staking Positions
-- Track staking positions for venues
CREATE TABLE IF NOT EXISTS vibe_staking_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
  
  -- Staked amount
  amount INTEGER NOT NULL,
  
  -- Lock period
  lock_start TIMESTAMPTZ NOT NULL,
  lock_end TIMESTAMPTZ,
  is_locked BOOLEAN DEFAULT true,
  
  -- Rewards
  pending_rewards INTEGER DEFAULT 0,
  total_rewards_claimed INTEGER DEFAULT 0,
  
  -- Multiplier
  multiplier DECIMAL(5, 2) DEFAULT 1.0,
  
  -- On-chain sync
  transaction_hash TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, venue_id)
);

CREATE INDEX idx_vibe_staking_user ON vibe_staking_positions(user_id);
CREATE INDEX idx_vibe_staking_venue ON vibe_staking_positions(venue_id);

-- Table: VIBE Earning Rules
-- Define how users can earn VIBE tokens
CREATE TABLE IF NOT EXISTS vibe_earning_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Rule definition
  action_type TEXT NOT NULL UNIQUE,
  action_name TEXT NOT NULL,
  description TEXT,
  
  -- Amount
  amount INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  
  -- Cooldown
  cooldown_seconds INTEGER DEFAULT 0,
  
  -- Requirements
  min_tier TEXT,
  requirements JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SECTION 4: DECENTRALIZED GOVERNANCE (DAO)
-- ============================================

-- Table: DAO Proposals
-- Store governance proposals
CREATE TABLE IF NOT EXISTS dao_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Proposal info
  proposal_id INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  proposal_type TEXT NOT NULL, -- 'city_expansion', 'dj_of_month', 'feature_proposal', 'reward_distribution', 'partnership', 'parameter_change'
  
  -- On-chain data
  contract_address TEXT,
  transaction_hash TEXT,
  
  -- Targets for execution
  targets JSONB DEFAULT '[]',
  values JSONB DEFAULT '[]',
  calldatas JSONB DEFAULT '[]',
  
  -- Voting
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'queued', 'executed', 'defeated', 'canceled')),
  for_votes INTEGER DEFAULT 0,
  against_votes INTEGER DEFAULT 0,
  abstain_votes INTEGER DEFAULT 0,
  
  -- Requirements
  quorum_required INTEGER,
  quorum_reached BOOLEAN DEFAULT false,
  
  -- Timing
  start_block BIGINT,
  end_block BIGINT,
  execution_time TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  
  -- Proposer
  proposer_id UUID REFERENCES auth.users(id),
  proposer_address TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dao_proposals_status ON dao_proposals(status);
CREATE INDEX idx_dao_proposals_type ON dao_proposals(proposal_type);
CREATE INDEX idx_dao_proposals_date ON dao_proposals(created_at DESC);

-- Table: DAO Votes
-- Track votes on proposals
CREATE TABLE IF NOT EXISTS dao_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES dao_proposals(id) ON DELETE CASCADE NOT NULL,
  voter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Vote details
  vote_type TEXT NOT NULL CHECK (vote_type IN ('for', 'against', 'abstain')),
  weight INTEGER NOT NULL,
  
  -- On-chain
  transaction_hash TEXT,
  block_number BIGINT,
  
  -- Optional reason
  reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(proposal_id, voter_id)
);

CREATE INDEX idx_dao_votes_proposal ON dao_votes(proposal_id);
CREATE INDEX idx_dao_votes_voter ON dao_votes(voter_id);

-- Table: DAO Delegations
-- Track voting power delegations
CREATE TABLE IF NOT EXISTS dao_delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  delegatee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Delegation details
  voting_power INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(delegator_id)
);

CREATE INDEX idx_dao_delegations_delegator ON dao_delegations(delegator_id);
CREATE INDEX idx_dao_delegations_delegatee ON dao_delegations(delegatee_id);

-- ============================================
-- SECTION 5: REVENUE SPLIT
-- ============================================

-- Table: Revenue Splits
-- Track revenue split configurations for venues
CREATE TABLE IF NOT EXISTS revenue_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Split percentages
  venue_percentage INTEGER DEFAULT 85,
  platform_percentage INTEGER DEFAULT 10,
  influencer_percentage INTEGER DEFAULT 3,
  rewards_percentage INTEGER DEFAULT 2,
  
  -- Payout addresses
  venue_payout_address TEXT,
  platform_payout_address TEXT,
  rewards_payout_address TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_revenue_splits_venue ON revenue_splits(venue_id);

-- Table: Revenue Transactions
-- Track all revenue split transactions
CREATE TABLE IF NOT EXISTS revenue_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Payment info
  payment_id TEXT UNIQUE NOT NULL,
  service_type TEXT NOT NULL, -- 'squad_table', 'bottle_service', 'cover_charge', 'vip_booking'
  total_amount DECIMAL(18, 2) NOT NULL,
  amount_after_fees DECIMAL(18, 2) NOT NULL,
  
  -- Split amounts
  venue_amount DECIMAL(18, 2) NOT NULL,
  platform_amount DECIMAL(18, 2) NOT NULL,
  influencer_amount DECIMAL(18, 2),
  rewards_amount DECIMAL(18, 2) NOT NULL,
  
  -- Processing fees
  processing_fee DECIMAL(18, 2),
  
  -- Parties
  venue_id UUID REFERENCES venues(id),
  user_id UUID REFERENCES auth.users(id),
  influencer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Payout status
  venue_paid BOOLEAN DEFAULT false,
  platform_paid BOOLEAN DEFAULT false,
  influencer_paid BOOLEAN DEFAULT false,
  rewards_paid BOOLEAN DEFAULT false,
  
  -- Payment method
  payment_method TEXT DEFAULT 'crypto', -- 'crypto', 'fiat', 'mixed'
  currency TEXT DEFAULT 'MATIC',
  
  -- On-chain
  transaction_hash TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'settled', 'disputed', 'refunded')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  settled_at TIMESTAMPTZ
);

CREATE INDEX idx_revenue_payments_venue ON revenue_transactions(venue_id);
CREATE INDEX idx_revenue_payments_user ON revenue_transactions(user_id);
CREATE INDEX idx_revenue_payments_status ON revenue_transactions(status);
CREATE INDEX idx_revenue_payments_date ON revenue_transactions(created_at DESC);

-- ============================================
-- SECTION 6: WALLET & ACCOUNT ABSTRACTION
-- ============================================

-- Table: Smart Wallets
-- Store smart wallet information for users
CREATE TABLE IF NOT EXISTS smart_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Wallet address
  wallet_address TEXT UNIQUE NOT NULL,
  
  -- Account abstraction
  account_abstraction_enabled BOOLEAN DEFAULT true,
  entry_point_address TEXT,
  factory_address TEXT,
  
  -- Paymaster
  paymaster_enabled BOOLEAN DEFAULT false,
  paymaster_address TEXT,
  
  -- Salt
  salt TEXT,
  
  -- First deploy
  is_deployed BOOLEAN DEFAULT false,
  deploy_transaction_hash TEXT,
  deployed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_smart_wallets_user ON smart_wallets(user_id);
CREATE INDEX idx_smart_wallets_address ON smart_wallets(wallet_address);

-- Table: Token Approvals
-- Track token approvals for smart wallets
CREATE TABLE IF NOT EXISTS token_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Token
  token_address TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  
  -- Spender (contract)
  spender_address TEXT NOT NULL,
  
  -- Amount
  amount TEXT NOT NULL, -- As string for bigint
  is_unlimited BOOLEAN DEFAULT false,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_token_approvals_user ON token_approvals(user_id);
CREATE INDEX idx_token_approvals_token ON token_approvals(token_address);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function: Calculate user reputation score
CREATE OR REPLACE FUNCTION calculate_reputation_score(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 0;
BEGIN
  -- Checkins
  SELECT COALESCE(SUM(5), 0) INTO v_score
  FROM checkins
  WHERE user_id = p_user_id;
  
  -- Reviews (10 points each)
  SELECT v_score + COALESCE(SUM(10), 0) INTO v_score
  FROM reviews
  WHERE user_id = p_user_id;
  
  -- Referrals (25 points each)
  SELECT v_score + (COUNT(*) * 25) INTO v_score
  FROM referrals
  WHERE referrer_id = p_user_id AND status = 'completed';
  
  -- NFT Passes (30 points each)
  SELECT v_score + (COUNT(*) * 30) INTO v_score
  FROM nft_pass_ownership
  WHERE owner_id = p_user_id;
  
  -- Squad Tables (50 points each)
  SELECT v_score + (COUNT(*) * 50) INTO v_score
  FROM revenue_transactions
  WHERE user_id = p_user_id AND service_type = 'squad_table';
  
  RETURN LEAST(v_score, 1000); -- Max 1000
END;
$$ LANGUAGE plpgsql;

-- Function: Update reputation score
CREATE OR REPLACE FUNCTION update_reputation_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Update SBT reputation
  UPDATE soulbound_tokens
  SET 
    reputation_score = calculate_reputation_score(NEW.user_id),
    updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  -- Update DID reputation
  UPDATE decentralized_identifiers
  SET 
    reputation_score = calculate_reputation_score(NEW.user_id),
    reputation_tier = (
      CASE
        WHEN calculate_reputation_score(NEW.user_id) >= 751 THEN 'legend'
        WHEN calculate_reputation_score(NEW.user_id) >= 501 THEN 'vip'
        WHEN calculate_reputation_score(NEW.user_id) >= 301 THEN 'influencer'
        WHEN calculate_reputation_score(NEW.user_id) >= 101 THEN 'regular'
        ELSE 'newcomer'
      END
    ),
    updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update reputation on relevant actions
CREATE TRIGGER trigger_update_reputation
AFTER INSERT OR UPDATE ON checkins
FOR EACH ROW EXECUTE FUNCTION update_reputation_score();

-- Function: Generate DID
CREATE OR REPLACE FUNCTION generate_did(p_wallet_address TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN 'did:nl:' || LOWER(p_wallet_address);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE decentralized_identifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE soulbound_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE zkp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_pass_ownership ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_pass_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_staking_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_earning_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE dao_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE dao_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dao_delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_approvals ENABLE ROW LEVEL SECURITY;

-- Users can view their own DID
CREATE POLICY "Users can view own DID" ON decentralized_identifiers
  FOR SELECT USING (user_id = auth.uid());

-- Users can view own SBT
CREATE POLICY "Users can view own SBT" ON soulbound_tokens
  FOR SELECT USING (user_id = auth.uid());

-- Users can view own achievements
CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (user_id = auth.uid());

-- ZKP verifications: users can only see own
CREATE POLICY "Users can view own ZKP" ON zkp_verifications
  FOR SELECT USING (user_id = auth.uid());

-- NFT Passes: public can read
CREATE POLICY "Anyone can read NFT passes" ON nft_passes
  FOR SELECT USING (is_active = true);

-- NFT Ownership: users can view own
CREATE POLICY "Users can view own NFT ownership" ON nft_pass_ownership
  FOR SELECT USING (owner_id = auth.uid());

-- VIBE Balances: users can view own
CREATE POLICY "Users can view own VIBE balance" ON vibe_token_balances
  FOR SELECT USING (user_id = auth.uid());

-- VIBE Transactions: users can view own
CREATE POLICY "Users can view own VIBE transactions" ON vibe_token_transactions
  FOR SELECT USING (user_id = auth.uid());

-- Staking: users can view own
CREATE POLICY "Users can view own staking" ON vibe_staking_positions
  FOR SELECT USING (user_id = auth.uid());

-- Earning rules: public can read
CREATE POLICY "Anyone can read earning rules" ON vibe_earning_rules
  FOR SELECT USING (is_active = true);

-- Proposals: public can read active
CREATE POLICY "Anyone can read active proposals" ON dao_proposals
  FOR SELECT USING (status IN ('active', 'executed', 'defeated'));

-- Votes: users can view own
CREATE POLICY "Users can view own votes" ON dao_votes
  FOR SELECT USING (voter_id = auth.uid());

-- Delegations: public can read
CREATE POLICY "Anyone can read delegations" ON dao_delegations
  FOR SELECT USING (is_active = true);

-- Revenue splits: public can read active
CREATE POLICY "Anyone can read active revenue splits" ON revenue_splits
  FOR SELECT USING (is_active = true);

-- Revenue transactions: users can view own
CREATE POLICY "Users can view own revenue" ON revenue_transactions
  FOR SELECT USING (user_id = auth.uid());

-- Smart wallets: users can view own
CREATE POLICY "Users can view own wallet" ON smart_wallets
  FOR SELECT USING (user_id = auth.uid());

-- Token approvals: users can view own
CREATE POLICY "Users can view own approvals" ON token_approvals
  FOR SELECT USING (user_id = auth.uid());
