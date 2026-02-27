-- =====================================================
-- SOCIAL GRAPH & PRIVACY SCHEMA - PHASE 4.1
-- Friends, Privacy Settings, Social Features
-- =====================================================

-- =====================================================
// 1. FRIENDSHIPS
-- =====================================================

CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, friend_id)
);

-- Friend check-ins (for "friends at venue" feature)
CREATE TABLE IF NOT EXISTS friend_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  
  -- Check-in details
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  checked_out_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  
  -- Privacy
  visible_to_friends BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
// 2. USER PRIVACY SETTINGS
-- =====================================================

CREATE TABLE IF NOT EXISTS user_privacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Location Sharing
  share_location_to VARCHAR(20) DEFAULT 'none', -- 'all_friends', 'select_friends', 'none'
  allowed_friend_ids UUID[], -- If 'select_friends' is chosen
  
  -- History
  show_checkin_history BOOLEAN DEFAULT false,
  show_venue_history BOOLEAN DEFAULT true,
  
  -- Incognito Mode
  is_incognito BOOLEAN DEFAULT false,
  incognito_until TIMESTAMPTZ,
  
  -- Preferences
  allow_friend_requests BOOLEAN DEFAULT true,
  show_online_status BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
// 3. SQUAD BOOKINGS (Group Bookings)
// =====================================================

CREATE TABLE IF NOT EXISTS squad_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Owner
  owner_id UUID NOT NULL REFERENCES profiles(id),
  venue_id UUID NOT NULL REFERENCES venues(id),
  
  -- Booking Details
  title VARCHAR(255),
  scheduled_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'open', -- 'open', 'full', 'completed', 'cancelled'
  
  -- Members (the squad)
  member_ids UUID[] DEFAULT '{}',
  max_members INTEGER DEFAULT 10,
  
  -- XP & Rewards
  xp_earned INTEGER DEFAULT 0,
  squad_bonus_applied BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
// 4. VIBE INVITES (Deep Links)
// =====================================================

CREATE TABLE IF NOT EXISTS vibe_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Creator
  user_id UUID NOT NULL REFERENCES profiles(id),
  venue_id UUID NOT NULL REFERENCES venues(id),
  
  -- Invite Details
  code VARCHAR(20) UNIQUE NOT NULL,
  message TEXT,
  max_uses INTEGER DEFAULT 10,
  uses_count INTEGER DEFAULT 0,
  
  -- Expiry
  expires_at TIMESTAMPTZ,
  
  -- Tracking
  clicked_count INTEGER DEFAULT 0,
  converted_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track invite conversions
CREATE TABLE IF NOT EXISTS vibe_invite_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id UUID NOT NULL REFERENCES vibe_invites(id) ON DELETE CASCADE,
  clicked_by UUID REFERENCES profiles(id),
  converted_to_booking BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
// 5. USER GAMIFICATION (Extended)
// =====================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD NOT EXISTS squad_leader_count INTEGER DEFAULT 0;

-- =====================================================
// INDEXES
// =====================================================

CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_checkins_user ON friend_checkins(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_friend_checkins_venue ON friend_checkins(venue_id, is_active);
CREATE INDEX IF NOT EXISTS idx_squad_bookings_owner ON squad_bookings(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_vibe_invites_code ON vibe_invites(code);

-- =====================================================
// RLS POLICIES
-- =====================================================

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_invite_clicks ENABLE ROW LEVEL SECURITY;

-- Friendships - users manage their own
CREATE POLICY "Users manage own friendships" ON friendships FOR ALL
  USING (user_id = auth.uid());

-- Privacy settings - users manage own
CREATE POLICY "Users manage own privacy" ON user_privacy_settings FOR ALL
  USING (user_id = auth.uid());

-- Check-ins - based on privacy
CREATE POLICY "View friends checkins" ON friend_checkins FOR SELECT
  USING (
    user_id IN (
      SELECT friend_id FROM friendships 
      WHERE user_id = auth.uid() AND status = 'accepted'
    )
  );

-- Squad bookings - owner and members
CREATE POLICY "Squad bookings access" ON squad_bookings FOR ALL
  USING (
    owner_id = auth.uid() 
    OR auth.uid() = ANY(member_ids)
  );

-- Vibe invites - public read, owner manage
CREATE POLICY "Anyone can use invite code" ON vibe_invites FOR SELECT
  USING (true);

CREATE POLICY "Owner manage invites" ON vibe_invites FOR ALL
  USING (user_id = auth.uid());

-- =====================================================
// FUNCTIONS
-- =====================================================

-- Send friend request
CREATE OR REPLACE FUNCTION send_friend_request(p_friend_id UUID)
RETURNS UUID AS $$
DECLARE
  v_request_id UUID;
BEGIN
  -- Check if friendship already exists (either direction)
  IF EXISTS (
    SELECT 1 FROM friendships 
    WHERE (user_id = auth.uid() AND friend_id = p_friend_id)
       OR (user_id = p_friend_id AND friend_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Friendship already exists';
  END IF;
  
  -- Create request
  INSERT INTO friendships (user_id, friend_id, status)
  VALUES (auth.uid(), p_friend_id, 'pending')
  RETURNING id INTO v_request_id;
  
  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql;

-- Accept friend request
CREATE OR REPLACE FUNCTION accept_friend_request(p_friendship_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE friendships
  SET status = 'accepted', updated_at = NOW()
  WHERE id = p_friendship_id AND friend_id = auth.uid() AND status = 'pending';
  
  -- Also create reverse friendship
  INSERT INTO friendships (user_id, friend_id, status)
  SELECT friend_id, user_id, 'accepted'
  FROM friendships
  WHERE id = p_friendship_id AND status = 'accepted'
  ON CONFLICT (user_id, friend_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Check in at venue (with privacy)
CREATE OR REPLACE FUNCTION checkin_at_venue(
  p_venue_id UUID,
  p_visible_to_friends BOOLEAN DEFAULT true
)
RETURNS UUID AS $$
DECLARE
  v_checkin_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Deactivate any existing check-in
  UPDATE friend_checkins
  SET is_active = false, checked_out_at = NOW()
  WHERE user_id = v_user_id AND is_active = true;
  
  -- Create new check-in
  INSERT INTO friend_checkins (user_id, venue_id, visible_to_friends)
  VALUES (v_user_id, p_venue_id, p_visible_to_friends)
  RETURNING id INTO v_checkin_id;
  
  RETURN v_checkin_id;
END;
$$ LANGUAGE plpgsql;

-- Check if user can see friend's location
CREATE OR REPLACE FUNCTION can_see_friend_location(
  p_viewer_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_setting VARCHAR(20);
  v_is_incognito BOOLEAN;
BEGIN
  -- Get user's privacy setting
  SELECT share_location_to, is_incognito INTO v_setting, v_is_incognito
  FROM user_privacy_settings
  WHERE user_id = p_user_id;
  
  -- If user is incognito, don't show
  IF v_is_incognito = true THEN
    RETURN false;
  END IF;
  
  -- If setting is none, don't show
  IF v_setting = 'none' OR v_setting IS NULL THEN
    RETURN false;
  END IF;
  
  -- If setting is all friends, check if they're friends
  IF v_setting = 'all_friends' THEN
    RETURN EXISTS (
      SELECT 1 FROM friendships
      WHERE (user_id = p_viewer_id AND friend_id = p_user_id)
         OR (user_id = p_user_id AND friend_id = p_viewer_id)
      AND status = 'accepted'
    );
  END IF;
  
  -- If select friends, check if viewer is in allowed list
  IF v_setting = 'select_friends' THEN
    RETURN EXISTS (
      SELECT 1 FROM friendships f
      JOIN user_privacy_settings u ON u.user_id = p_user_id
      WHERE f.user_id = p_user_id AND f.friend_id = p_viewer_id
      AND f.status = 'accepted'
      AND p_viewer_id = ANY(u.allowed_friend_ids)
    );
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Generate unique vibe invite code
CREATE OR REPLACE FUNCTION generate_vibe_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
BEGIN
  -- Generate 8 char alphanumeric code
  code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
  RETURN code;
END;
$$ LANGUAGE plpgsql;
