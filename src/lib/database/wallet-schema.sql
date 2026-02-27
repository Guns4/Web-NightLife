-- ============================================
-- PHASE 4.3: DIGITAL MEMBERSHIP CARD (WALLET INTEGRATION)
-- Apple Wallet & Google Wallet Pass Generation
-- ============================================

-- Table: Membership Cards
-- Digital membership cards for Apple Wallet and Google Wallet
CREATE TABLE IF NOT EXISTS membership_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Card identification
  card_serial_number TEXT UNIQUE NOT NULL,
  member_id TEXT UNIQUE NOT NULL,
  
  -- QR Code for verification (TOTP-based)
  qr_dynamic_token TEXT,
  qr_secret_key TEXT UNIQUE NOT NULL,
  qr_generated_at TIMESTAMPTZ,
  
  -- Pass URLs
  apple_pass_url TEXT,
  google_pass_url TEXT,
  pass_url TEXT, -- Generic URL for web viewing
  
  -- Wallet sync status
  wallet_type TEXT DEFAULT 'both', -- 'apple', 'google', 'both'
  last_synced TIMESTAMPTZ,
  is_synced BOOLEAN DEFAULT false,
  
  -- Tier and privileges
  current_tier TEXT DEFAULT 'bronze' CHECK (current_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  tier_since TIMESTAMPTZ DEFAULT NOW(),
  
  -- Privileges based on tier
  privileges JSONB DEFAULT '[]',
  
  -- Validation
  is_valid BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_membership_cards_user_id ON membership_cards(user_id);
CREATE INDEX idx_membership_cards_serial ON membership_cards(card_serial_number);
CREATE INDEX idx_membership_cards_member_id ON membership_cards(member_id);
CREATE INDEX idx_membership_cards_tier ON membership_cards(current_tier);

-- Table: Member Scan History
-- Track when and where cards were scanned
CREATE TABLE IF NOT EXISTS member_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES membership_cards(id) ON DELETE CASCADE NOT NULL,
  scanned_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scanned_by_staff_id UUID REFERENCES venue_staff(user_id) ON DELETE SET NULL,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  station_id UUID REFERENCES venue_stations(id) ON DELETE SET NULL,
  
  -- Scan details
  scan_method TEXT DEFAULT 'qr', -- 'qr', 'nfc', 'manual'
  scan_result TEXT, -- 'success', 'expired', 'invalid', 'tier_mismatch'
  
  -- Location
  location_coordinates POINT,
  
  -- Timestamps
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_member_scans_card_id ON member_scans(card_id);
CREATE INDEX idx_member_scans_venue_id ON member_scans(venue_id);
CREATE INDEX idx_member_scans_scanned_at ON member_scans(scanned_at DESC);

-- Table: Tier Privileges
-- Define privileges for each tier
CREATE TABLE IF NOT EXISTS tier_privileges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  
  -- Privilege details
  privilege_name TEXT NOT NULL,
  privilege_type TEXT NOT NULL, -- 'free_entry', 'discount', 'priority', 'bottle_service', 'exclusive_access'
  privilege_value TEXT NOT NULL, -- JSON: { "count": 2, "percentage": 10, "description": "..." }
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tier, venue_id, privilege_name)
);

CREATE INDEX idx_tier_privileges_tier ON tier_privileges(tier);
CREATE INDEX idx_tier_privileges_venue ON tier_privileges(venue_id);

-- Table: Pass Notifications
-- Track push notifications for pass updates
CREATE TABLE IF NOT EXISTS pass_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  card_id UUID REFERENCES membership_cards(id) ON DELETE CASCADE,
  
  -- Notification details
  notification_type TEXT NOT NULL, -- 'tier_upgrade', 'pass_synced', 'scanned', 'expiring'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  
  -- Status
  sent BOOLEAN DEFAULT false,
  delivered BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

CREATE INDEX idx_pass_notifications_user ON pass_notifications(user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function: Generate unique card serial number
CREATE OR REPLACE FUNCTION generate_card_serial()
RETURNS TEXT AS $$
DECLARE
  v_serial TEXT;
BEGIN
  v_serial := 'NL' || TO_CHAR(NOW(), 'YYYY') || '-' || 
    LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  RETURN v_serial;
END;
$$ LANGUAGE plpgsql;

-- Function: Generate member ID
CREATE OR REPLACE FUNCTION generate_member_id(p_tier TEXT)
RETURNS TEXT AS $$
DECLARE
  v_prefix TEXT;
  v_number TEXT;
BEGIN
  CASE p_tier
    WHEN 'bronze' THEN v_prefix := 'BZ';
    WHEN 'silver' THEN v_prefix := 'SV';
    WHEN 'gold' THEN v_prefix := 'GD';
    WHEN 'platinum' THEN v_prefix := 'PL';
    ELSE v_prefix := 'BZ';
  END CASE;
  
  v_number := LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
  RETURN v_prefix || v_number;
END;
$$ LANGUAGE plpgsql;

-- Function: Generate QR token (TOTP-based)
CREATE OR REPLACE FUNCTION generate_qr_token(p_secret_key TEXT, p_period INTEGER DEFAULT 30)
RETURNS TEXT AS $$
DECLARE
  v_timestamp BIGINT;
  v_hash TEXT;
BEGIN
  v_timestamp := FLOOR(EXTRACT(EPOCH FROM NOW()) / p_period);
  
  v_hash := encode(
    hmac(
      p_secret_key || v_timestamp::TEXT,
      p_secret_key,
      'sha256'
    ),
    'hex'
  );
  
  RETURN UPPER(SUBSTRING(v_hash FROM LENGTH(v_hash) - 7 FOR 8));
END;
$$ LANGUAGE plpgsql;

-- Function: Get member privileges based on tier
CREATE OR REPLACE FUNCTION get_member_privileges(p_tier TEXT, p_venue_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  v_privileges JSONB;
BEGIN
  -- Base privileges by tier
  CASE p_tier
    WHEN 'bronze' THEN
      v_privileges := '[
        {"name": "Entry Points", "value": "1", "description": "1x Free Entry per month"},
        {"name": "Birthday Reward", "value": "10%", "description": "10% Birthday Discount"}
      ]'::JSONB;
    WHEN 'silver' THEN
      v_privileges := '[
        {"name": "Entry Points", "value": "2", "description": "2x Free Entry per month"},
        {"name": "Birthday Reward", "value": "20%", "description": "20% Birthday Discount"},
        {"name": "Queue Skip", "value": "true", "description": "Priority Queue Access"}
      ]'::JSONB;
    WHEN 'gold' THEN
      v_privileges := '[
        {"name": "Entry Points", "value": "4", "description": "4x Free Entry per month"},
        {"name": "Birthday Reward", "value": "50%", "description": "50% Birthday Discount"},
        {"name": "Queue Skip", "value": "true", "description": "VIP Queue Access"},
        {"name": "Bottle Discount", "value": "15%", "description": "15% Off Bottle Service"},
        {"name": "Guest Pass", "value": "1", "description": "1 Free Guest Monthly"}
      ]'::JSONB;
    WHEN 'platinum' THEN
      v_privileges := '[
        {"name": "Unlimited Entry", "value": "true", "description": "Unlimited Free Entry"},
        {"name": "Birthday Reward", "value": "100%", "description": "100% Birthday Free Entry"},
        {"name": "Express Entry", "value": "true", "description": "Dedicated Express Lane"},
        {"name": "Bottle Discount", "value": "25%", "description": "25% Off Bottle Service"},
        {"name": "Guest Pass", "value": "3", "description": "3 Free Guests Monthly"},
        {"name": "VIP Area Access", "value": "true", "description": "Exclusive VIP Area Access"},
        {"name": "Complimentary Drinks", "value": "2", "description": "2 Complimentary Drinks Monthly"}
      ]'::JSONB;
    ELSE
      v_privileges := '[]'::JSONB;
  END CASE;
  
  -- If venue-specific, would merge with venue privileges here
  RETURN v_privileges;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Create membership card when user profile is created
CREATE OR REPLACE FUNCTION create_membership_card()
RETURNS TRIGGER AS $$
DECLARE
  v_card_id UUID;
  v_serial TEXT;
  v_member_id TEXT;
  v_secret_key TEXT;
BEGIN
  -- Check if card already exists
  SELECT id INTO v_card_id FROM membership_cards WHERE user_id = NEW.id;
  
  IF v_card_id IS NULL THEN
    -- Generate unique values
    v_serial := generate_card_serial();
    v_member_id := generate_member_id(COALESCE(NEW.tier, 'bronze'));
    v_secret_key := gen_random_uuid();
    
    -- Create membership card
    INSERT INTO membership_cards (
      user_id,
      card_serial_number,
      member_id,
      qr_secret_key,
      current_tier,
      privileges,
      tier_since
    ) VALUES (
      NEW.id,
      v_serial,
      v_member_id,
      v_secret_key,
      COALESCE(NEW.tier, 'bronze'),
      get_member_privileges(COALESCE(NEW.tier, 'bronze')),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update card when user tier changes
CREATE OR REPLACE FUNCTION update_card_on_tier_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tier IS DISTINCT FROM OLD.tier THEN
    UPDATE membership_cards
    SET 
      current_tier = NEW.tier,
      member_id = generate_member_id(NEW.tier),
      privileges = get_member_privileges(NEW.tier),
      tier_since = NOW(),
      updated_at = NOW()
    WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE membership_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_privileges ENABLE ROW LEVEL SECURITY;
ALTER TABLE pass_notifications ENABLE ROW LEVEL SECURITY;

-- Membership cards: User can view own, owners can view venue members
CREATE POLICY "Users can view own card" ON membership_cards
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own card" ON membership_cards
  FOR UPDATE USING (user_id = auth.uid());

-- Member scans: Users can view own scan history
CREATE POLICY "Users can view own scans" ON member_scans
  FOR SELECT USING (
    card_id IN (
      SELECT id FROM membership_cards WHERE user_id = auth.uid()
    )
  );

-- Venue owners can view scans at their venues
CREATE POLICY "Owners can view venue scans" ON member_scans
  FOR SELECT USING (
    venue_id IN (
      SELECT id FROM venues WHERE owner_id = auth.uid()
    )
  );

-- Tier privileges: Public can read active
CREATE POLICY "Anyone can read active privileges" ON tier_privileges
  FOR SELECT USING (is_active = true);

-- Pass notifications: Only recipient can read
CREATE POLICY "Users can read own pass notifications" ON pass_notifications
  FOR SELECT USING (user_id = auth.uid());
