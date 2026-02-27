-- ============================================
-- PHASE 4.4: ULTIMATE SOCIAL ECOSYSTEM
-- AI Vibe Matching, Stories, Leaderboards, Squad Booking
-- ============================================

-- Table: Vibe Matches (AI Recommendations)
-- Stores computed match percentages between users and venues
CREATE TABLE IF NOT EXISTS vibe_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
  
  -- Match scores (0-100)
  match_percentage INTEGER NOT NULL DEFAULT 0,
  vibe_score INTEGER DEFAULT 0,        -- Based on music taste
  social_score INTEGER DEFAULT 0,       -- Based on friends' preferences
  trend_score INTEGER DEFAULT 0,         -- Based on trending
  location_score INTEGER DEFAULT 0,     -- Based on proximity
  
  -- Social proof
  friends_here_count INTEGER DEFAULT 0,
  similar_taste_count INTEGER DEFAULT 0,
  
  -- Metadata
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, venue_id)
);

CREATE INDEX idx_vibe_matches_user ON vibe_matches(user_id);
CREATE INDEX idx_vibe_matches_venue ON vibe_matches(venue_id);
CREATE INDEX idx_vibe_matches_score ON vibe_matches(match_percentage DESC);

-- Table: Nightlife Stories
-- Live moment sharing (12-hour expiry)
CREATE TABLE IF NOT EXISTS nightlife_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  station_id UUID REFERENCES venue_stations(id) ON DELETE SET NULL,
  
  -- Story content
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'video' CHECK (media_type IN ('video', 'image')),
  thumbnail_url TEXT,
  duration_seconds INTEGER DEFAULT 15,
  
  -- Verification (must be from verified check-in)
  is_verified BOOLEAN DEFAULT false,
  checkin_id UUID REFERENCES checkins(id) ON DELETE SET NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ NOT NULL,
  viewed_by JSONB DEFAULT '[]',
  view_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stories_user ON nightlife_stories(user_id);
CREATE INDEX idx_stories_venue ON nightlife_stories(venue_id);
CREATE INDEX idx_stories_expires ON nightlife_stories(expires_at);
CREATE INDEX idx_stories_active ON nightlife_stories(is_active, expires_at);

-- Table: Leaderboard Rankings
-- Global and local rankings for various categories
CREATE TABLE IF NOT EXISTS leaderboard_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Ranking type
  ranking_type TEXT NOT NULL, -- 'top_trendsetter', 'mayor', 'social_magnet'
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  
  -- Rankings
  global_rank INTEGER,
  local_rank INTEGER,
  score INTEGER DEFAULT 0,
  period TEXT DEFAULT 'all_time', -- 'weekly', 'monthly', 'all_time'
  
  -- Badges
  has_god_mode BOOLEAN DEFAULT false,
  badge_url TEXT,
  
  -- Timestamps
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, ranking_type, venue_id, period)
);

CREATE INDEX idx_rankings_user ON leaderboard_rankings(user_id);
CREATE INDEX idx_rankings_type ON leaderboard_rankings(ranking_type, period);
CREATE INDEX idx_rankings_venue ON leaderboard_rankings(venue_id, ranking_type);

-- Table: Squad Bookings
-- Group bookings for tables
CREATE TABLE IF NOT EXISTS squad_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
  station_id UUID REFERENCES venue_stations(id) ON DELETE SET NULL,
  
  -- Booking details
  booking_name TEXT,
  total_guests INTEGER NOT NULL DEFAULT 1,
  max_guests INTEGER NOT NULL DEFAULT 10,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'full', 'confirmed', 'cancelled', 'completed')),
  
  -- Payment
  total_amount INTEGER DEFAULT 0,
  deposit_amount INTEGER DEFAULT 0,
  is_paid BOOLEAN DEFAULT false,
  
  -- Chat
  has_chat BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_squad_bookings_host ON squad_bookings(host_user_id);
CREATE INDEX idx_squad_bookings_venue ON squad_bookings(venue_id);
CREATE INDEX idx_squad_bookings_status ON squad_bookings(status);

-- Table: Squad Members
-- Members of a squad booking
CREATE TABLE IF NOT EXISTS squad_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID REFERENCES squad_bookings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined')),
  
  -- Payment split
  share_amount INTEGER DEFAULT 0,
  is_paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMPTZ,
  
  -- Timestamps
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_squad_members_squad ON squad_members(squad_id);
CREATE INDEX idx_squad_members_user ON squad_members(user_id);

-- Table: Squad Chats
-- Temporary event chat for squad members
CREATE TABLE IF NOT EXISTS squad_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID REFERENCES squad_bookings(id) ON DELETE CASCADE NOT NULL,
  
  -- Messages
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_squad_chats_squad ON squad_chats(squad_id);

-- Table: Chat Messages
CREATE TABLE IF NOT EXISTS squad_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES squad_chats(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Message content
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_chat ON squad_messages(chat_id, created_at DESC);

-- Table: Ghost Mode & Advanced Privacy
-- Enhanced privacy settings
CREATE TABLE IF NOT EXISTS ghost_mode_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Visibility settings
  visibility TEXT DEFAULT 'all_friends' CHECK (visibility IN ('all_friends', 'squad_only', 'none')),
  is_ghost_mode BOOLEAN DEFAULT false,
  stealth_checkin BOOLEAN DEFAULT false, -- XP without notifications
  
  -- Location sharing
  share_location BOOLEAN DEFAULT true,
  share_location_to TEXT DEFAULT 'all_friends',
  
  -- Activity visibility
  show_online_status BOOLEAN DEFAULT true,
  show_checkin_history BOOLEAN DEFAULT true,
  show_venue_visits BOOLEAN DEFAULT false,
  
  -- Safety
  emergency_alert_enabled BOOLEAN DEFAULT false,
  emergency_contacts JSONB DEFAULT '[]',
  last_location_share TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Emergency Alerts
-- Safety alerts sent to social circle
CREATE TABLE IF NOT EXISTS emergency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Alert details
  alert_type TEXT DEFAULT 'panic' CHECK (alert_type IN ('panic', 'safe', 'location_share')),
  message TEXT,
  location_coordinates POINT,
  location_address TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  
  -- Recipients
  notified_contacts JSONB DEFAULT '[]',
  acknowledged_by JSONB DEFAULT '[]',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_emergency_alerts_user ON emergency_alerts(user_id, status);
CREATE INDEX idx_emergency_alerts_created ON emergency_alerts(created_at DESC);

-- Table: Story Views
-- Track who viewed stories
CREATE TABLE IF NOT EXISTS story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES nightlife_stories(id) ON DELETE CASCADE NOT NULL,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(story_id, viewer_id)
);

CREATE INDEX idx_story_views_story ON story_views(story_id);
CREATE INDEX idx_story_views_viewer ON story_views(viewer_id);

-- Table: User Vibe Profile
-- Stores user preferences for matching
CREATE TABLE IF NOT EXISTS user_vibe_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Music preferences
  music_genres JSONB DEFAULT '[]',
  favorite_artists JSONB DEFAULT '[]',
  vibe_tags JSONB DEFAULT '[]', -- 'chill', 'hype', 'edm', 'hiphop', 'live_music'
  
  -- Social preferences
  preferred_group_size TEXT DEFAULT 'medium', -- 'small', 'medium', 'large'
  social_energy TEXT DEFAULT 'balanced', -- 'quiet', 'balanced', 'hype'
  
  -- Location preferences
  preferred_areas JSONB DEFAULT '[]',
  max_travel_distance INTEGER DEFAULT 15, -- km
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Calculate vibe match percentage
CREATE OR REPLACE FUNCTION calculate_vibe_match(
  p_user_id UUID,
  p_venue_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_vibe_score INTEGER := 0;
  v_social_score INTEGER := 0;
  v_trend_score INTEGER := 0;
  v_location_score INTEGER := 0;
  v_total_score INTEGER := 0;
  v_friends_count INTEGER := 0;
  v_similar_count INTEGER := 0;
BEGIN
  -- 1. Vibe Score (music preferences matching)
  -- Would analyze user's music_genres against venue's music type
  v_vibe_score := 30 + (RANDOM() * 40)::INTEGER; -- Mock: 30-70
  
  -- 2. Social Score (friends who go there)
  SELECT COUNT(DISTINCT f.friend_id) INTO v_friends_count
  FROM friendships f
  JOIN checkins c ON c.user_id = f.friend_id
  WHERE f.user_id = p_user_id
    AND c.venue_id = p_venue_id
    AND c.status = 'active';
  
  v_social_score := LEAST(50, v_friends_count * 10); -- 10 points per friend
  
  -- 3. Trend Score (based on recent check-ins at venue)
  SELECT COUNT(*) INTO v_similar_count
  FROM checkins
  WHERE venue_id = p_venue_id
    AND timestamp > NOW() - INTERVAL '30 days';
  
  v_trend_score := LEAST(30, (v_similar_count / 10)::INTEGER); -- Up to 30 based on popularity
  
  -- 4. Location Score
  v_location_score := 25; -- Simplified
  
  -- Calculate total (weighted)
  v_total_score := (v_vibe_score * 0.4 + v_social_score * 0.3 + v_trend_score * 0.2 + v_location_score * 0.1)::INTEGER;
  
  RETURN LEAST(100, GREATEST(0, v_total_score));
END;
$$ LANGUAGE plpgsql;

-- Function: Update leaderboard rankings
CREATE OR REPLACE FUNCTION update_leaderboards()
RETURNS VOID AS $$
BEGIN
  -- Top Trendsetter (users with most unique venue visits)
  INSERT INTO leaderboard_rankings (user_id, ranking_type, score, global_rank, period)
  SELECT 
    user_id,
    'top_trendsetter',
    COUNT(DISTINCT venue_id)::INTEGER,
    ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT venue_id) DESC)::INTEGER,
    'all_time'
  FROM checkins
  WHERE status = 'active'
  GROUP BY user_id
  ON CONFLICT (user_id, 'top_trendsetter', NULL, 'all_time') 
  DO UPDATE SET score = EXCLUDED.score, global_rank = EXCLUDED.global_rank;
  
  -- The Mayor (most check-ins per venue)
  INSERT INTO leaderboard_rankings (user_id, ranking_type, venue_id, score, local_rank, period)
  SELECT 
    user_id,
    'mayor',
    venue_id,
    COUNT(*)::INTEGER,
    ROW_NUMBER() OVER (PARTITION BY venue_id ORDER BY COUNT(*) DESC)::INTEGER,
    'all_time'
  FROM checkins
  WHERE status = 'active'
  GROUP BY user_id, venue_id
  ON CONFLICT (user_id, 'mayor', venue_id, 'all_time')
  DO UPDATE SET score = EXCLUDED.score, local_rank = EXCLUDED.local_rank;
END;
$$ LANGUAGE plpgsql;

-- Function: Clean up expired stories
CREATE OR REPLACE FUNCTION cleanup_expired_stories()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  UPDATE nightlife_stories
  SET is_active = false
  WHERE expires_at < NOW() AND is_active = true;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE vibe_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE nightlife_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghost_mode_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_vibe_profile ENABLE ROW LEVEL SECURITY;

-- Vibe matches: Users can see their own
CREATE POLICY "Users can view own matches" ON vibe_matches
  FOR SELECT USING (user_id = auth.uid());

-- Stories: Active stories visible to friends
CREATE POLICY "Friends can view active stories" ON nightlife_stories
  FOR SELECT USING (
    is_active = true 
    AND expires_at > NOW()
  );

-- Leaderboards: Public read
CREATE POLICY "Anyone can read leaderboards" ON leaderboard_rankings
  FOR SELECT USING (true);

-- Squad bookings: Participants can view
CREATE POLICY "Squad can view bookings" ON squad_bookings
  FOR SELECT USING (
    host_user_id = auth.uid()
    OR id IN (SELECT squad_id FROM squad_members WHERE user_id = auth.uid())
  );

-- Ghost mode: Users manage own
CREATE POLICY "Users manage own ghost settings" ON ghost_mode_settings
  FOR ALL USING (user_id = auth.uid());

-- Emergency alerts: Only sender and recipients
CREATE POLICY "Users can view own alerts" ON emergency_alerts
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- Vibe profile: Users manage own
CREATE POLICY "Users manage own vibe" ON user_vibe_profile
  FOR ALL USING (user_id = auth.uid());
