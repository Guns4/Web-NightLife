-- ============================================
-- PHASE 5.2: PREDICTIVE INTELLIGENCE & AUTONOMOUS REVENUE
-- The Crystal Ball, Revenue Optimizer, Smart Discounts
-- ============================================

-- Enable pgvector extension for similarity search
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================
-- 1. PREDICTIVE CROWD FORECASTING (THE CRYSTAL BALL)
-- ============================================

-- Table: Venue Occupancy Predictions
-- ML predictions for venue occupancy for the next 48 hours
CREATE TABLE IF NOT EXISTS venue_occupancy_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
    
    -- Prediction window (every 2 hours for 48 hours)
    prediction_time TIMESTAMPTZ NOT NULL, -- The time being predicted
    predicted_occupancy INTEGER NOT NULL, -- 0-100 percentage
    predicted_occupancy_level TEXT CHECK (predicted_occupancy_level IN ('empty', 'low', 'medium', 'high', 'full')) NOT NULL,
    
    -- Confidence score
    confidence_score FLOAT DEFAULT 0.0, -- 0-1 confidence
    
    -- Model inputs used for prediction
    input_features JSONB DEFAULT '{}', -- Weather, events, historical, social buzz
    
    -- Peak time flag
    is_predicted_peak BOOLEAN DEFAULT false,
    
    -- Timestamps
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(venue_id, prediction_time)
);

CREATE INDEX idx_predictions_venue ON venue_occupancy_predictions(venue_id, prediction_time DESC);
CREATE INDEX idx_predictions_peak ON venue_occupancy_predictions(venue_id, is_predicted_peak) WHERE is_predicted_peak = true;

-- Table: Social Buzz Tracking
-- Track social media mentions and engagement
CREATE TABLE IF NOT EXISTS social_buzz_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
    
    -- Platform
    platform TEXT NOT NULL, -- 'instagram', 'tiktok', 'twitter', 'facebook'
    
    -- Metrics
    mention_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    engagement_score FLOAT DEFAULT 0.0,
    
    -- Time period
    tracked_date DATE NOT NULL,
    
    -- Sample posts (for analysis)
    trending_posts JSONB DEFAULT '[]',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(venue_id, platform, tracked_date)
);

CREATE INDEX idx_buzz_venue_date ON social_buzz_tracking(venue_id, tracked_date DESC);

-- Table: External Factors Tracking
-- Weather, events, holidays that affect predictions
CREATE TABLE IF NOT EXISTS external_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city TEXT NOT NULL,
    factor_type TEXT NOT NULL, -- 'weather', 'event', 'holiday'
    
    -- Factor details
    factor_value TEXT NOT NULL, -- 'rain', 'clear', 'music_festival', 'new_year'
    impact_score FLOAT DEFAULT 0.0, -- -1 to 1 impact on indoor vs outdoor
    
    -- Time window
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    
    -- Source
    source TEXT, -- 'openweather', 'ticket_com', 'government'
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_factors_city_time ON external_factors(city, start_time DESC);

-- ============================================
-- 2. DYNAMIC "SMART-BOOST" 2.0 (REVENUE OPTIMIZER)
-- ============================================

-- Table: Smart Boost Campaigns (Auto-Pilot Marketing)
-- Autonomous bidding with AI-triggered boosts
CREATE TABLE IF NOT EXISTS smart_boost_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Campaign settings
    campaign_name TEXT NOT NULL,
    daily_budget INTEGER NOT NULL, -- In rupiah
    total_spent INTEGER DEFAULT 0,
    
    -- Auto-pilot settings
    auto_pilot_enabled BOOLEAN DEFAULT true,
    
    -- Trigger conditions (AI will auto-trigger when ALL met)
    trigger_conditions JSONB DEFAULT '{
        "below_occupancy_threshold": 50,
        "audience_radius_km": 3,
        "min_audience_density": 10,
        "check_competitor_full": true
    }',
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'budget_exhausted')),
    
    -- AI Recommendations
    ai_recommendation TEXT, -- "AI recommends boosting: Low occupancy (30%) + High audience detected"
    last_triggered_at TIMESTAMPTZ,
    trigger_count INTEGER DEFAULT 0,
    
    -- Metrics
    total_impressions INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    total_bookings INTEGER DEFAULT 0,
    cost_per_booking INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ
);

CREATE INDEX idx_smart_boost_venue ON smart_boost_campaigns(venue_id);
CREATE INDEX idx_smart_boost_status ON smart_boost_campaigns(status);
CREATE INDEX idx_smart_boost_owner ON smart_boost_campaigns(owner_id);

-- Table: Boost Triggers Log
-- Log of each auto-trigger event
CREATE TABLE IF NOT EXISTS boost_trigger_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES smart_boost_campaigns(id) ON DELETE CASCADE NOT NULL,
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
    
    -- Trigger reason
    trigger_reason TEXT NOT NULL, -- 'low_occupancy', 'high_audience', 'competitor_full'
    trigger_details JSONB DEFAULT '{}',
    
    -- Occupancy at trigger time
    predicted_occupancy INTEGER,
    actual_occupancy INTEGER,
    
    -- Audience detection
    audience_within_3km INTEGER,
    competitor_venues_full JSONB DEFAULT '[],
    
    -- Boost result
    boost_duration_minutes INTEGER,
    impressions_generated INTEGER DEFAULT 0,
    clicks_generated INTEGER DEFAULT 0,
    spend_amount INTEGER DEFAULT 0,
    
    -- Timestamps
    triggered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_boost_logs_campaign ON boost_trigger_logs(campaign_id);
CREATE INDEX idx_boost_logs_time ON boost_trigger_logs(triggered_at DESC);

-- ============================================
-- 3. AI-DRIVEN DYNAMIC PRICING HOOKS
-- ============================================

-- Table: Smart Discount Rules
-- AI-managed dynamic pricing rules
CREATE TABLE IF NOT EXISTS smart_discount_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
    
    -- Rule configuration
    rule_name TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    
    -- Discount parameters
    discount_percentage INTEGER CHECK (discount_percentage >= 5 AND discount_percentage <= 70),
    max_uses INTEGER, -- NULL = unlimited
    current_uses INTEGER DEFAULT 0,
    
    -- Target audience
    target_tier TEXT CHECK (target_tier IN ('bronze', 'silver', 'gold', 'platinum', 'all')),
    target_radius_km FLOAT DEFAULT 5.0,
    
    -- Trigger conditions (AI monitors these)
    trigger_conditions JSONB DEFAULT '{
        "day_of_week": ["Tuesday", "Wednesday"],
        "min_time": "18:00",
        "max_time": "23:00",
        "max_occupancy_threshold": 40,
        "min_available_tables": 5
    }',
    
    -- Scheduling
    valid_days INT[] DEFAULT '{1,2,3,4,5}', -- Monday=1, Sunday=7
    valid_start_time TIME DEFAULT '18:00:00',
    valid_end_time TIME DEFAULT '23:00:00',
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired', 'exhausted')),
    
    -- AI-generated insights
    ai_generation_reason TEXT, -- "AI detected slow Tuesday - generating discount to fill tables"
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    activated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

CREATE INDEX idx_smart_discount_venue ON smart_discount_rules(venue_id);
CREATE INDEX idx_smart_discount_status ON smart_discount_rules(status);

-- Table: Smart Discount Claims
-- Track which users claimed AI-generated discounts
CREATE TABLE IF NOT EXISTS smart_discount_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID REFERENCES smart_discount_rules(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
    
    -- Discount code
    discount_code TEXT UNIQUE NOT NULL,
    discount_value INTEGER, -- Actual discount applied
    
    -- Status
    status TEXT DEFAULT 'issued' CHECK (status IN ('issued', 'used', 'expired')),
    
    -- Usage
    used_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX idx_discount_claims_user ON smart_discount_claims(user_id);
CREATE INDEX idx_discount_claims_code ON smart_discount_claims(discount_code);

-- ============================================
-- 4. DEEP-LEARNING SENTIMENT ANALYTICS (VOICE OF THE GUEST)
-- ============================================

-- Table: Review Sentiment Analysis
-- AI-analyzed sentiment from vibe_checks and reviews
CREATE TABLE IF NOT EXISTS review_sentiment_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL, -- References vibe_checks or external review
    review_type TEXT NOT NULL, -- 'vibe_check', 'google', 'tripadvisor'
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
    
    -- Sentiment scores (AI computed)
    overall_sentiment FLOAT NOT NULL, -- -1 to 1 (negative to positive)
    sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'neutral', 'negative')),
    
    -- Aspect-based sentiment
    aspect_sentiments JSONB DEFAULT '{}', -- { "music": 0.8, "service": -0.3, "food": 0.5, "ambiance": 0.9 }
    
    -- Key themes/topics detected
    detected_themes JSONB DEFAULT '[]', -- ["good_dj", "loud_music", "long_queue", "great_service"]
    
    -- Specific entity mentions
    entity_mentions JSONB DEFAULT '[]', -- [{ "type": "dj", "name": "DJ Alok", "sentiment": 0.8 }]
    
    -- Action items (AI recommendations)
    action_items JSONB DEFAULT '[]', -- ["Fix AC in Room 4", "Reduce wait time"]
    
    -- Raw analysis
    ai_model_version TEXT,
    raw_analysis JSONB DEFAULT '{}',
    
    -- Timestamps
    analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sentiment_venue ON review_sentiment_analysis(venue_id);
CREATE INDEX idx_sentiment_overall ON review_sentiment_analysis(overall_sentiment);
CREATE INDEX idx_sentiment_themes ON review_sentiment_analysis(detected_themes);

-- Table: Venue Sentiment Summaries
-- Aggregated sentiment for quick dashboard access
CREATE TABLE IF NOT EXISTS venue_sentiment_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
    
    -- Time period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Aggregate scores
    avg_sentiment FLOAT DEFAULT 0.0,
    total_reviews INTEGER DEFAULT 0,
    sentiment_trend TEXT CHECK (sentiment_trend IN ('improving', 'stable', 'declining')),
    
    -- Top issues (most mentioned negatives)
    top_issues JSONB DEFAULT '[]', -- [{ "issue": "AC not working", "count": 15, "severity": "high" }]
    
    -- Top positives
    top_positives JSONB DEFAULT '[]', -- [{ "positive": "Great DJ", "count": 20 }]
    
    -- Weekly action plan
    weekly_action_plan JSONB DEFAULT '[]', -- [{ "action": "Fix AC in Room 4", "priority": "high", "assigned_to": "maintenance" }]
    
    -- Specific insights
    music_insights JSONB DEFAULT '{}', -- { "dj_alok": { "mentions": 10, "sentiment": 0.9 } }
    service_insights JSONB DEFAULT '{}',
    ambiance_insights JSONB DEFAULT '{}',
    
    -- Timestamps
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sentiment_summary_venue ON venue_sentiment_summaries(venue_id, period_start DESC);

-- ============================================
-- 5. CROSS-PROMOTION SYNDICATE
-- ============================================

-- Table: Venue Syndicate Groups
-- Groups of venues that share similar audiences
CREATE TABLE IF NOT EXISTS venue_syndicate_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_name TEXT NOT NULL,
    description TEXT,
    
    -- Group type
    syndicate_type TEXT DEFAULT 'cross_promotion' CHECK (syndicate_type IN ('cross_promotion', 'package_deal', 'event_series')),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Syndicate Members
-- Venues in each syndicate group
CREATE TABLE IF NOT EXISTS syndicate_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES venue_syndicate_groups(id) ON DELETE CASCADE NOT NULL,
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
    
    -- Member metadata
    audience_overlap_score FLOAT DEFAULT 0.0, -- How much audience overlaps
    cross_promo_revenue INTEGER DEFAULT 0, -- Revenue from cross-promo
    
    -- Status
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(group_id, venue_id)
);

CREATE INDEX idx_syndicate_members_group ON syndicate_members(group_id);
CREATE INDEX idx_syndicate_members_venue ON syndicate_members(venue_id);

-- Table: Cross-Promo Offers
-- AI-generated cross-promotion offers
CREATE TABLE IF NOT EXISTS cross_promo_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES venue_syndicate_groups(id) ON DELETE CASCADE NOT NULL,
    
    -- Offer details
    offer_name TEXT NOT NULL,
    offer_description TEXT,
    discount_percentage INTEGER,
    
    -- Participating venues
    primary_venue_id UUID REFERENCES venues(id), -- The venue user is at
    secondary_venue_id UUID REFERENCES venues(id), -- The recommended venue
    
    -- Target users (AI selected)
    target_user_count INTEGER,
    targeted_user_segment TEXT, -- 'spa_lovers', 'jazz_fans', etc.
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    
    -- Results
    views INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    redemptions INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ
);

CREATE INDEX idx_cross_promo_group ON cross_promo_offers(group_id);
CREATE INDEX idx_cross_promo_status ON cross_promo_offers(status);

-- ============================================
-- 6. VECTOR EMBEDDINGS FOR SIMILARITY SEARCH
-- ============================================

-- Table: Venue Embeddings
-- Vector embeddings for venue similarity search
CREATE TABLE IF NOT EXISTS venue_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL UNIQUE,
    
    -- Embedding vector (1536 dimensions for OpenAI ada-002)
    embedding VECTOR(1536),
    
    -- Metadata for filtering
    venue_features JSONB DEFAULT '{}',
    
    -- Timestamps
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_venue_embeddings_ann ON venue_embeddings USING ann (embedding);

-- Table: User Embeddings
-- Vector embeddings for user preference matching
CREATE TABLE IF NOT EXISTS user_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    
    -- Embedding vector
    embedding VECTOR(1536),
    
    -- Preference metadata
    preference_features JSONB DEFAULT '{}',
    
    -- Last updated
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_embeddings_ann ON user_embeddings USING ann (embedding);
CREATE INDEX idx_user_embeddings_user ON user_embeddings(user_id);

-- ============================================
-- 7. AI CONCIERGE CHAT LOGS
-- ============================================

-- Table: Concierge Chat Sessions
-- Chat logs for the Vibe Concierge AI
CREATE TABLE IF NOT EXISTS concierge_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Session context
    session_type TEXT DEFAULT 'general', -- 'date', 'group', 'solo', 'business'
    user_budget INTEGER,
    user_location TEXT,
    user_preferences JSONB DEFAULT '{}',
    
    -- User input
    user_query TEXT NOT NULL,
    
    -- AI response
    ai_response JSONB DEFAULT '{
        "recommendations": [],
        "reasoning": "",
        "booking_links": []
    }',
    
    -- Outcome tracking
    venue_booked UUID REFERENCES venues(id),
    session_completed BOOLEAN DEFAULT false,
    user_rating INTEGER, -- 1-5 rating for the recommendations
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

CREATE INDEX idx_concierge_user ON concierge_sessions(user_id, created_at DESC);
CREATE INDEX idx_concierge_completed ON concierge_sessions(user_id, session_completed);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Get predicted peak time for venue
CREATE OR REPLACE FUNCTION get_predicted_peak_time(p_venue_id UUID)
RETURNS TABLE (
    prediction_time TIMESTAMPTZ,
    predicted_occupancy INTEGER,
    is_predicted_peak BOOLEAN,
    confidence_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vop.prediction_time,
        vop.predicted_occupancy,
        vop.is_predicted_peak,
        vop.confidence_score
    FROM venue_occupancy_predictions vop
    WHERE vop.venue_id = p_venue_id
      AND vop.prediction_time >= NOW()
      AND vop.prediction_time <= NOW() + INTERVAL '48 hours'
    ORDER BY vop.predicted_occupancy DESC, vop.prediction_time ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function: Check if smart boost should trigger
CREATE OR REPLACE FUNCTION should_trigger_smart_boost(p_venue_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_current_occupancy INTEGER;
    v_audience_count INTEGER;
    v_competitor_full BOOLEAN;
BEGIN
    -- Get current predicted occupancy
    SELECT predicted_occupancy INTO v_current_occupancy
    FROM venue_occupancy_predictions
    WHERE venue_id = p_venue_id
      AND prediction_time >= NOW()
      AND prediction_time <= NOW() + INTERVAL '1 hour'
    ORDER BY prediction_time ASC
    LIMIT 1;
    
    -- Get audience within 3km (simplified)
    v_audience_count := 0; -- Would query user locations
    
    -- Check competitor fullness (simplified)
    v_competitor_full := false; -- Would query nearby venues
    
    -- Build result
    v_result := jsonb_build_object(
        'should_trigger', 
            (v_current_occupancy < 50) OR (v_audience_count > 10) OR v_competitor_full,
        'current_occupancy', v_current_occupancy,
        'audience_count', v_audience_count,
        'competitor_full', v_competitor_full,
        'reason',
            CASE 
                WHEN v_current_occupancy < 50 THEN 'Low occupancy detected'
                WHEN v_audience_count > 10 THEN 'High audience density'
                WHEN v_competitor_full THEN 'Competitors at capacity'
                ELSE 'No trigger conditions met'
            END
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function: Generate sentiment summary for venue
CREATE OR REPLACE FUNCTION generate_sentiment_summary(
    p_venue_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS UUID AS $$
DECLARE
    v_summary_id UUID;
    v_avg_sentiment FLOAT;
    v_trend TEXT;
    v_issues JSONB;
    v_positives JSONB;
BEGIN
    -- Calculate average sentiment
    SELECT AVG(overall_sentiment), COUNT(*)
    INTO v_avg_sentiment, v_issues
    FROM review_sentiment_analysis
    WHERE venue_id = p_venue_id
      AND DATE(analyzed_at) BETWEEN p_start_date AND p_end_date;
    
    -- Determine trend (simplified)
    v_trend := 'stable';
    
    -- Extract top issues
    SELECT jsonb_agg(jsonb_build_object(
        'issue', (jsonb_array_elements(detected_themes)),
        'count', 1
    ))
    INTO v_issues
    FROM review_sentiment_analysis
    WHERE venue_id = p_venue_id
      AND DATE(analyzed_at) BETWEEN p_start_date AND p_end_date
      AND overall_sentiment < 0;
    
    -- Create summary
    INSERT INTO venue_sentiment_summaries (
        venue_id,
        period_start,
        period_end,
        avg_sentiment,
        total_reviews,
        sentiment_trend,
        top_issues,
        top_positives
    ) VALUES (
        p_venue_id,
        p_start_date,
        p_end_date,
        COALESCE(v_avg_sentiment, 0),
        COALESCE(v_issues::INTEGER, 0),
        v_trend,
        COALESCE(v_issues, '[]'::JSONB),
        '[]'::JSONB
    )
    RETURNING id INTO v_summary_id;
    
    RETURN v_summary_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Find similar venues using vector embeddings
CREATE OR REPLACE FUNCTION find_similar_venues(
    p_venue_id UUID,
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    venue_id UUID,
    venue_name TEXT,
    similarity_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.name,
        1 - (ve.embedding <=> (SELECT embedding FROM venue_embeddings WHERE venue_id = p_venue_id)) AS similarity_score
    FROM venue_embeddings ve
    JOIN venues v ON v.id = ve.venue_id
    WHERE ve.venue_id != p_venue_id
      AND v.is_active = true
    ORDER BY ve.embedding <=> (SELECT embedding FROM venue_embeddings WHERE venue_id = p_venue_id)
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function: Recommend venues for concierge query
CREATE OR REPLACE FUNCTION recommend_venues_for_concierge(
    p_user_id UUID,
    p_query TEXT,
    p_budget INTEGER,
    p_location TEXT,
    p_music_preference TEXT,
    p_limit INTEGER DEFAULT 3
)
RETURNS TABLE (
    venue_id UUID,
    venue_name TEXT,
    category TEXT,
    price_range INTEGER,
    match_score FLOAT,
    reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.name,
        v.category::TEXT,
        v.price_range,
        -- Simplified matching (would use embeddings in production)
        (100 - ABS(v.price_range - COALESCE(p_budget, 2)) * 20)::FLOAT AS match_score,
        -- Generate reason
        CASE 
            WHEN p_music_preference IS NOT NULL THEN 'Matches your ' || p_music_preference || ' preference'
            ELSE 'Recommended based on your profile'
        END AS reason
    FROM venues v
    WHERE v.is_active = true
      AND (p_location IS NULL OR v.city ILIKE '%' || p_location || '%')
      AND (p_budget IS NULL OR v.price_range <= p_budget)
    ORDER BY v.rating DESC, v.price_range ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE venue_occupancy_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_buzz_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_boost_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE boost_trigger_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_discount_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_discount_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_sentiment_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_sentiment_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_syndicate_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE syndicate_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_promo_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE concierge_sessions ENABLE ROW LEVEL SECURITY;

-- Venue predictions: Public can read
CREATE POLICY "Anyone read venue predictions" ON venue_occupancy_predictions
    FOR SELECT USING (true);

-- Smart boost: Owners manage own
CREATE POLICY "Owners manage own smart boost" ON smart_boost_campaigns
    FOR ALL USING (owner_id = auth.uid());

-- Boost logs: Public can read
CREATE POLICY "Anyone read boost logs" ON boost_trigger_logs
    FOR SELECT USING (true);

-- Smart discounts: Owners manage own
CREATE POLICY "Owners manage own discounts" ON smart_discount_rules
    FOR ALL USING (
        venue_id IN (SELECT id FROM venues WHERE owner_id = auth.uid())
    );

-- Discount claims: Users can view own
CREATE POLICY "Users view own discount claims" ON smart_discount_claims
    FOR ALL USING (user_id = auth.uid());

-- Sentiment: Public can read
CREATE POLICY "Anyone read sentiment analysis" ON review_sentiment_analysis
    FOR SELECT USING (true);

-- Sentiment summaries: Owners can read own
CREATE POLICY "Owners read own sentiment" ON venue_sentiment_summaries
    FOR SELECT USING (
        venue_id IN (SELECT id FROM venues WHERE owner_id = auth.uid())
    );

-- Syndicate: Public can read
CREATE POLICY "Anyone read syndicates" ON venue_syndicate_groups
    FOR SELECT USING (is_active = true);

-- Cross-promo: Public can read active
CREATE POLICY "Anyone read active cross-promo" ON cross_promo_offers
    FOR SELECT USING (status = 'active');

-- Embeddings: Service role only
CREATE POLICY "Service manage embeddings" ON venue_embeddings
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users manage own embedding" ON user_embeddings
    FOR ALL USING (user_id = auth.uid());

-- Concierge: Users manage own sessions
CREATE POLICY "Users manage own concierge sessions" ON concierge_sessions
    FOR ALL USING (user_id = auth.uid());
