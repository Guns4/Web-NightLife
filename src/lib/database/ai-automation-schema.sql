-- ============================================
-- PHASE 5: THE NEURAL BRAIN (AI & AUTOMATION)
-- AI Recommendation Engine, Smart Push, Content Curation
-- ============================================

-- Table: AI User Profiles (Enhanced with ML features)
-- Stores computed user preferences for recommendations
CREATE TABLE IF NOT EXISTS ai_user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Computed preferences (updated by AI)
  music_preference_scores JSONB DEFAULT '{}', -- { "techno": 0.8, "hiphop": 0.6, ... }
  spending_pattern JSONB DEFAULT '{}', -- { "avg_spend": 500000, "preferred_tier": "gold" }
  social_score FLOAT DEFAULT 0.0, -- 0-100 social influence score
  activity_pattern JSONB DEFAULT '{}', -- { "peak_hours": ["22:00", "23:00"], "preferred_days": ["Fri", "Sat"] }
  
  -- Engagement scores
  open_rate FLOAT DEFAULT 0.0, -- Push notification open rate
  booking_conversion_rate FLOAT DEFAULT 0.0, -- Views to bookings
  friend_invite_rate FLOAT DEFAULT 0.0, -- Invites accepted
  
  -- AI settings
  ai_opt_in BOOLEAN DEFAULT true,
  last_analyzed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_profiles_user ON ai_user_profiles(user_id);

-- Table: Venue AI Scores
-- Computed scores for each user-venue pair
CREATE TABLE IF NOT EXISTS venue_ai_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
  
  -- Score components
  music_match_score INTEGER DEFAULT 0, -- 0-100
  spending_match_score INTEGER DEFAULT 0,
  social_density_score INTEGER DEFAULT 0,
  proximity_score INTEGER DEFAULT 0,
  
  -- Final weighted score
  overall_score INTEGER DEFAULT 0,
  match_reason TEXT, -- "95% Match: 4 friends here & they play Techno"
  
  -- Cached data
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, venue_id)
);

CREATE INDEX idx_venue_ai_scores_user ON venue_ai_scores(user_id);
CREATE INDEX idx_venue_ai_scores_venue ON venue_ai_scores(venue_id);
CREATE INDEX idx_venue_ai_scores_overall ON venue_ai_scores(overall_score DESC);

-- Table: Smart Push Campaigns
-- Automated notification campaigns
CREATE TABLE IF NOT EXISTS smart_push_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  
  -- Campaign details
  campaign_type TEXT NOT NULL, -- 'abandoned_plan', 'weekend_warmup', 'geofence_deal', 'flash_sale', 'personalized'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Targeting
  target_audience JSONB DEFAULT '[]', -- User segments
  excluded_users JSONB DEFAULT '[]',
  
  -- Scheduling
  schedule_type TEXT DEFAULT 'immediate', -- 'immediate', 'scheduled', 'recurring', 'trigger_based'
  scheduled_at TIMESTAMPTZ,
  recurrence_pattern TEXT, -- 'weekly', 'monthly'
  
  -- Trigger conditions (for trigger_based)
  trigger_conditions JSONB DEFAULT '{}',
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  
  -- AI generated
  is_ai_generated BOOLEAN DEFAULT false,
  ai_model_version TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX idx_campaigns_venue ON smart_push_campaigns(venue_id);
CREATE INDEX idx_campaigns_status ON smart_push_campaigns(status);
CREATE INDEX idx_campaigns_scheduled ON smart_push_campaigns(scheduled_at);

-- Table: Push Notifications
-- Individual notifications sent to users
CREATE TABLE IF NOT EXISTS push_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES smart_push_campaigns(id) ON DELETE SET NULL,
  
  -- Notification content
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}', -- Deep links, extra data
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'failed')),
  
  -- Metrics
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON push_notifications(user_id);
CREATE INDEX idx_notifications_campaign ON push_notifications(campaign_id);
CREATE INDEX idx_notifications_status ON push_notifications(status);

-- Table: Content Highlights
-- AI-curated top moments
CREATE TABLE IF NOT EXISTS content_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES nightlife_stories(id) ON DELETE CASCADE NOT NULL,
  
  -- Curation data
  curation_score FLOAT DEFAULT 0.0, -- AI computed score
  view_count INTEGER DEFAULT 0,
  engagement_score FLOAT DEFAULT 0.0,
  
  -- AI generated caption
  ai_caption TEXT,
  ai_caption_model TEXT,
  generated_at TIMESTAMPTZ,
  
  -- Display settings
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_highlights_curation ON content_highlights(curation_score DESC);
CREATE INDEX idx_highlights_featured ON content_highlights(is_featured, is_active);

-- Table: AI Ad Campaigns
-- Smart boost campaigns for venues
CREATE TABLE IF NOT EXISTS ai_ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Campaign details
  campaign_name TEXT NOT NULL,
  budget INTEGER NOT NULL, -- In rupiah
  duration_days INTEGER DEFAULT 1,
  
  -- AI Optimization
  ai_optimized BOOLEAN DEFAULT true,
  suggested_budget INTEGER,
  suggested_schedule JSONB DEFAULT '[]', -- Best times to run
  target_audience_size INTEGER,
  
  -- Targeting (AI computed)
  target_user_segments JSONB DEFAULT '[]',
  predicted_reach INTEGER,
  predicted_conversions INTEGER,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed')),
  
  -- Metrics
  actual_impressions INTEGER DEFAULT 0,
  actual_clicks INTEGER DEFAULT 0,
  actual_conversions INTEGER DEFAULT 0,
  cost_per_result INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

CREATE INDEX idx_ai_ads_venue ON ai_ad_campaigns(venue_id);
CREATE INDEX idx_ai_ads_status ON ai_ad_campaigns(status);

-- Table: Nightlife Reports
-- Monthly user recap data
CREATE TABLE IF NOT EXISTS nightlife_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Report period
  report_month DATE NOT NULL,
  report_year INTEGER NOT NULL,
  
  -- Statistics
  total_visits INTEGER DEFAULT 0,
  unique_venues INTEGER DEFAULT 0,
  cities_visited JSONB DEFAULT '[]',
  total_spent INTEGER DEFAULT 0,
  
  -- Genre breakdown
  genre_breakdown JSONB DEFAULT '{}',
  
  -- Social stats
  friends_made INTEGER DEFAULT 0,
  squad_bookings INTEGER DEFAULT 0,
  invites_sent INTEGER DEFAULT 0,
  
  -- Rankings
  local_rank INTEGER,
  national_rank INTEGER,
  percentile INTEGER,
  
  -- AI insights
  top_genre TEXT,
  top_venue TEXT,
  vibe_persona TEXT, -- "Party Animal", "Chill Vibes", "VIP Regular"
  
  -- Share data
  share_token TEXT UNIQUE,
  share_url TEXT,
  is_shared BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_user ON nightlife_reports(user_id, report_year, report_month);

-- Table: AI Moderation Queue
-- Content pending moderation
CREATE TABLE IF NOT EXISTS moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL, -- 'story', 'review', 'comment'
  content_id UUID NOT NULL,
  content_url TEXT,
  
  -- Moderation results
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
  moderation_score FLOAT, -- 0-1 confidence score
  detected_issues JSONB DEFAULT '[]',
  ai_verdict TEXT, -- 'safe', 'nsfw', 'violence', 'spam', 'unclear'
  
  -- Human review
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX idx_moderation_status ON moderation_queue(status);
CREATE INDEX idx_moderation_content ON moderation_queue(content_type, content_id);

-- Table: User Activity Tracking
-- For abandoned plan detection
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Activity details
  activity_type TEXT NOT NULL, -- 'venue_view', 'venue_search', 'booking_start', 'booking_abandon'
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  session_id TEXT,
  
  -- Context
  metadata JSONB DEFAULT '{}',
  source TEXT, -- 'search', 'feed', 'friend_share', 'push'
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_user ON user_activity_logs(user_id, created_at DESC);
CREATE INDEX idx_activity_venue ON user_activity_logs(venue_id);
CREATE INDEX idx_activity_type ON user_activity_logs(activity_type);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Calculate venue match score for a user
CREATE OR REPLACE FUNCTION calculate_venue_match(
  p_user_id UUID,
  p_venue_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_music_score INTEGER := 0;
  v_spending_score INTEGER := 0;
  v_social_score INTEGER := 0;
  v_proximity_score INTEGER := 50;
  v_total_score INTEGER := 0;
  v_reason TEXT;
  v_friends_count INTEGER := 0;
  v_venue_genre TEXT;
BEGIN
  -- Get venue genre
  SELECT music_genre INTO v_venue_genre FROM venues WHERE id = p_venue_id;
  
  -- Get user's music preference for this genre
  SELECT (music_preference_scores->>v_venue_genre)::FLOAT INTO v_music_score
  FROM ai_user_profiles
  WHERE user_id = p_user_id;
  
  IF v_music_score IS NULL THEN
    v_music_score := 30 + (RANDOM() * 40)::INTEGER;
  ELSE
    v_music_score := (v_music_score * 100)::INTEGER;
  END IF;
  
  -- Get friends at venue
  SELECT COUNT(DISTINCT c.user_id) INTO v_friends_count
  FROM checkins c
  JOIN friendships f ON f.friend_id = c.user_id
  WHERE f.user_id = p_user_id
    AND c.venue_id = p_venue_id
    AND c.status = 'active';
  
  v_social_score := LEAST(100, v_friends_count * 25);
  
  -- Calculate spending match (simplified)
  v_spending_score := 60 + (RANDOM() * 30)::INTEGER;
  
  -- Weighted total
  v_total_score := (v_music_score * 0.35 + v_social_score * 0.35 + v_spending_score * 0.2 + v_proximity_score * 0.1)::INTEGER;
  v_total_score := LEAST(100, GREATEST(0, v_total_score));
  
  -- Generate reason
  IF v_friends_count > 0 THEN
    v_reason := v_total_score || '% Match: ' || v_friends_count || ' friend(s) here';
    IF v_venue_genre IS NOT NULL THEN
      v_reason := v_reason || ' & they play ' || INITCAP(v_venue_genre);
    END IF;
  ELSE
    v_reason := v_total_score || '% Match: Perfect for your vibe';
  END IF;
  
  RETURN jsonb_build_object(
    'music_score', v_music_score,
    'spending_score', v_spending_score,
    'social_score', v_social_score,
    'proximity_score', v_proximity_score,
    'total_score', v_total_score,
    'reason', v_reason
  );
END;
$$ LANGUAGE plpgsql;

-- Function: Detect abandoned booking plans
CREATE OR REPLACE FUNCTION detect_abandoned_plans()
RETURNS TABLE(user_id UUID, venue_id UUID, view_count INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.user_id,
    l.venue_id,
    COUNT(*)::INTEGER as view_count
  FROM user_activity_logs l
  WHERE l.activity_type = 'venue_view'
    AND l.created_at > NOW() - INTERVAL '24 hours'
    AND NOT EXISTS (
      SELECT 1 FROM user_activity_logs l2
      WHERE l2.user_id = l.user_id
        AND l2.venue_id = l.venue_id
        AND l2.activity_type = 'booking_start'
        AND l2.created_at > l.created_at
    )
  GROUP BY l.user_id, l.venue_id
  HAVING COUNT(*) >= 3;
END;
$$ LANGUAGE plpgsql;

-- Function: Generate monthly report
CREATE OR REPLACE FUNCTION generate_monthly_report(
  p_user_id UUID,
  p_month INTEGER,
  p_year INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_report_id UUID;
  v_total_visits INTEGER;
  v_unique_venues INTEGER;
  v_total_spent INTEGER;
BEGIN
  -- Get visit statistics
  SELECT COUNT(*), COUNT(DISTINCT venue_id), COALESCE(SUM(xp_awarded), 0)
  INTO v_total_visits, v_unique_venues, v_total_spent
  FROM checkins
  WHERE user_id = p_user_id
    AND EXTRACT(MONTH FROM timestamp) = p_month
    AND EXTRACT(YEAR FROM timestamp) = p_year;
  
  -- Generate report
  INSERT INTO nightlife_reports (
    user_id,
    report_month,
    report_year,
    total_visits,
    unique_venues,
    total_spent,
    vibe_persona
  ) VALUES (
    p_user_id,
    MAKE_DATE(p_year, p_month, 1),
    p_year,
    v_total_visits,
    v_unique_venues,
    v_total_spent,
    CASE 
      WHEN v_total_visits >= 10 THEN 'Party Animal'
      WHEN v_total_visits >= 5 THEN 'Weekend Warrior'
      WHEN v_unique_venues >= 3 THEN 'Explorer'
      ELSE 'Casual Vibes'
    END
  )
  RETURNING id INTO v_report_id;
  
  RETURN v_report_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE ai_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_ai_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_push_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE nightlife_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- AI profiles: Users manage own
CREATE POLICY "Users manage own AI profile" ON ai_user_profiles
  FOR ALL USING (user_id = auth.uid());

-- Venue AI scores: Users can view own
CREATE POLICY "Users view own venue scores" ON venue_ai_scores
  FOR SELECT USING (user_id = auth.uid());

-- Push notifications: Users view own
CREATE POLICY "Users view own notifications" ON push_notifications
  FOR SELECT USING (user_id = auth.uid());

-- Reports: Users view own
CREATE POLICY "Users view own reports" ON nightlife_reports
  FOR SELECT USING (user_id = auth.uid());

-- Moderation: Public can read approved content
CREATE POLICY "Anyone read approved highlights" ON content_highlights
  FOR SELECT USING (is_active = true);

-- Ad campaigns: Owners manage own
CREATE POLICY "Owners manage own ads" ON ai_ad_campaigns
  FOR ALL USING (owner_id = auth.uid());
