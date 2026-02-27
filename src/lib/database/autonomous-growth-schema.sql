-- ============================================
-- PHASE 5.4: AUTONOMOUS GROWTH & SELF-HEALING ECOSYSTEM
-- Auto-Designer, Reputation Medic, Escrow Guardian
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. AI AUTONOMOUS AD-CREATIVE (CREATIVE GEN)
-- ============================================

-- Table: Auto-Generated Ad Creatives
-- AI-generated promotional content
CREATE TABLE auto_generated_creatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
    
    -- Creative details
    creative_type TEXT NOT NULL, -- 'poster', 'reel', 'story', 'banner'
    title TEXT,
    description TEXT,
    
    -- Media assets
    media_url TEXT,
    media_type TEXT, -- 'image', 'video'
    
    -- AI generation context
    source_content_id UUID, -- Reference to nightlife_stories or live_vibe_status
    venue_logo_url TEXT,
    promo_text TEXT,
    music_track TEXT,
    
    -- Generation settings
    target_audience JSONB DEFAULT '{}',
    dimensions TEXT, -- '1080x1080', '1080x1920', etc.
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'ready', 'active', 'paused', 'expired')),
    
    -- Performance metrics
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    ctr FLOAT DEFAULT 0.0,
    
    -- Timestamps
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    activated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

CREATE INDEX idx_creatives_venue ON auto_generated_creatives(venue_id);
CREATE INDEX idx_creatives_status ON auto_generated_creatives(status);

-- Table: Creative Generation Templates
-- Templates for AI to follow
CREATE TABLE creative_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Template details
    name TEXT NOT NULL,
    template_type TEXT NOT NULL, -- 'party', 'romantic', 'chill', 'luxury', 'happy_hour'
    description TEXT,
    
    -- Visual style
    color_palette JSONB DEFAULT '[]',
    font_styles JSONB DEFAULT '[]',
    layout_style TEXT,
    
    -- Elements
    required_elements JSONB DEFAULT '[]', -- ['venue_logo', 'promo_text', 'cta_button']
    optional_elements JSONB DEFAULT '[]',
    
    -- AI prompts
    ai_prompt_template TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Sponsored Highlights
-- AI-curated and promoted content
CREATE TABLE sponsored_highlights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
    story_id UUID REFERENCES nightlife_stories(id) ON DELETE SET NULL,
    
    -- Promotion details
    is_sponsored BOOLEAN DEFAULT true,
    sponsor_budget INTEGER,
    
    -- Targeting
    target_user_segments JSONB DEFAULT '[]',
    target_location JSONB, -- { radius_km: 5, center: { lat, lng } }
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'completed', 'paused')),
    
    -- Performance
    impressions INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    engagements INTEGER DEFAULT 0,
    
    -- Timestamps
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sponsored_venue ON sponsored_highlights(venue_id);
CREATE INDEX idx_sponsored_status ON sponsored_highlights(status);

-- ============================================
-- 2. SENTIMENT RECOVERY PROTOCOL
-- ============================================

-- Table: Crisis Alerts
-- AI-detected negative review alerts
CREATE TABLE crisis_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
    review_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Alert details
    alert_type TEXT NOT NULL, -- 'negative_review', 'low_rating', 'complaint'
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Review info
    rating INTEGER,
    review_text TEXT,
    review_source TEXT, -- 'vibe_check', 'google', 'tripadvisor'
    
    -- Response status
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'ignored')),
    
    -- Resolution
    resolution_type TEXT, -- 'discount_sent', 'personal_reach', 'no_action'
    discount_code TEXT,
    resolution_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_crisis_venue ON crisis_alerts(venue_id);
CREATE INDEX idx_crisis_status ON crisis_alerts(status);
CREATE INDEX idx_crisis_severity ON crisis_alerts(severity);

-- Table: Peace Offering Coupons
-- Auto-generated recovery discounts
CREATE TABLE peace_offering_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crisis_alert_id UUID REFERENCES crisis_alerts(id) ON DELETE CASCADE NOT NULL,
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Coupon details
    coupon_code TEXT UNIQUE NOT NULL,
    discount_percentage INTEGER NOT NULL,
    discount_type TEXT DEFAULT 'percentage', -- 'percentage', 'fixed'
    discount_value INTEGER, -- Fixed amount if not percentage
    
    -- Validity
    valid_hours INTEGER DEFAULT 48,
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'used', 'expired')),
    
    -- Tracking
    sent_via TEXT, -- 'whatsapp', 'push', 'sms'
    sent_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ,
    
    -- Result
    resulted_in_revised_review BOOLEAN,
    new_rating INTEGER,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX idx_peace_user ON peace_offering_coupons(user_id);
CREATE INDEX idx_peace_status ON peace_offering_coupons(status);

-- ============================================
-- 3. DYNAMIC REVENUE PROTECTION (NO-SHOW PREDICTOR)
-- ============================================

-- Table: No-Show Risk Profiles
-- AI-calculated no-show probability
CREATE TABLE no_show_risk_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth.users(id) user_id UUID REFERENCES ON DELETE CASCADE NOT NULL UNIQUE,
    
    -- Risk assessment
    no_show_score INTEGER DEFAULT 0 CHECK (no_show_score >= 0 AND no_show_score <= 100),
    risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
    
    -- Factors
    total_bookings INTEGER DEFAULT 0,
    completed_bookings INTEGER DEFAULT 0,
    no_show_count INTEGER DEFAULT 0,
    cancellation_count INTEGER DEFAULT 0,
    last_no_show_date TIMESTAMPTZ,
    
    -- Behavior patterns
    avg_confirmation_time_mins INTEGER, -- How long before they confirm
    avg_arrival_offset_mins INTEGER, -- Early/late compared to booking time
    
    -- Required actions
    requires_deposit BOOLEAN DEFAULT false,
    deposit_percentage INTEGER DEFAULT 50,
    
    -- Timestamps
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_noshow_user ON no_show_risk_profiles(user_id);
CREATE INDEX idx_noshow_level ON no_show_risk_profiles(risk_level);

-- Table: Booking Deposit Requirements
-- Dynamic deposit enforcement
CREATE TABLE booking_deposit_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
    
    -- Deposit details
    deposit_amount INTEGER NOT NULL,
    deposit_percentage INTEGER DEFAULT 50,
    total_booking_value INTEGER,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded', 'forfeited', 'waived')),
    
    -- Payment
    payment_method TEXT, -- 'wallet', 'card', 'ovo', 'dana'
    payment_id TEXT,
    
    -- Refund (after visit)
    refund_amount INTEGER DEFAULT 0,
    refund_status TEXT,
    
    -- Reminder tracking
    reminder_3h_sent BOOLEAN DEFAULT false,
    reminder_1h_sent BOOLEAN DEFAULT false,
    reminder_30m_sent BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

CREATE INDEX idx_deposit_booking ON booking_deposit_requirements(booking_id);
CREATE INDEX idx_deposit_user ON booking_deposit_requirements(user_id);

-- Table: Booking Reminders
-- Automated WhatsApp/notification reminders
CREATE TABLE booking_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Reminder details
    reminder_type TEXT NOT NULL, -- 'deposit_due', 'reminder_3h', 'reminder_1h', 'reminder_30m', 'confirmation'
    scheduled_for TIMESTAMPTZ NOT NULL,
    
    -- Channel
    channel TEXT DEFAULT 'whatsapp', -- 'whatsapp', 'push', 'sms'
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    
    -- Content
    message_text TEXT,
    
    -- Delivery
    sent_at TIMESTAMPTZ,
    delivery_status TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reminders_booking ON booking_reminders(booking_id);
CREATE INDEX idx_reminders_scheduled ON booking_reminders(scheduled_for, status);

-- ============================================
-- 4. CROSS-NETWORK SYNDICATE (AI-DRIVEN PARTNERSHIPS)
-- ============================================

-- Table: User Journey Patterns
-- AI-detected user flow patterns
CREATE TABLE user_journey_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Pattern details
    pattern_type TEXT NOT NULL, -- 'same_day', 'next_day', 'weekly', 'monthly'
    source_venue_category TEXT NOT NULL,
    target_venue_category TEXT NOT NULL,
    
    -- Statistics
    occurrence_count INTEGER DEFAULT 0,
    conversion_rate FLOAT DEFAULT 0.0,
    
    -- AI confidence
    confidence_score FLOAT DEFAULT 0.0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    last_detected TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_journey_patterns ON user_journey_patterns(source_venue_category, target_venue_category);

-- Table: Recovery Bundles
-- Cross-venue promotional bundles
CREATE TABLE recovery_bundles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Bundle details
    bundle_name TEXT NOT NULL,
    description TEXT,
    
    -- Source and target
    source_venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
    source_venue_category TEXT,
    target_venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
    target_venue_category TEXT,
    
    -- Offer
    discount_percentage INTEGER DEFAULT 10,
    valid_hours INTEGER DEFAULT 24,
    
    -- Targeting
    target_user_segments JSONB DEFAULT '[]', -- 'club_goers', 'spa_lovers', etc.
    min_visit_count INTEGER DEFAULT 1,
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'expired')),
    
    -- Performance
    sent_count INTEGER DEFAULT 0,
    used_count INTEGER DEFAULT 0,
    revenue_generated INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    activated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

CREATE INDEX idx_bundles_status ON recovery_bundles(status);

-- Table: Bundle Delivery Log
-- Track bundle notifications
CREATE TABLE bundle_delivery_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id UUID REFERENCES recovery_bundles(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Delivery details
    channel TEXT DEFAULT 'push', -- 'push', 'whatsapp', 'sms'
    
    -- Status
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'used', 'ignored')),
    
    -- Timestamps
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    opened_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ
);

CREATE INDEX idx_bundle_log_user ON bundle_delivery_log(user_id);

-- ============================================
-- 5. VOICE-ACTIVATED VIBE SEARCH (AI CONCIERGE 2.0)
-- ============================================

-- Table: Voice Query Sessions
-- Voice note interactions
CREATE TABLE voice_query_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Voice input
    audio_url TEXT,
    transcription_text TEXT,
    
    -- Analysis
    analyzed_intent TEXT, -- 'find_venue', 'book_table', 'get_promo', 'find_friends'
    sentiment_score FLOAT, -- -1 to 1
    extracted_preferences JSONB DEFAULT '{}', -- { music: 'rnb', budget: 2000000, location: 'senopati' }
    
    -- Response
    response_text TEXT,
    response_audio_url TEXT,
    
    -- Recommendations
    recommended_venues JSONB DEFAULT '[]',
    
    -- Status
    session_completed BOOLEAN DEFAULT false,
    user_satisfaction INTEGER, -- 1-5 rating
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_voice_user ON voice_query_sessions(user_id);
CREATE INDEX idx_voice_intent ON voice_query_sessions(analyzed_intent);

-- ============================================
-- 6. ACTIVITY AUDIT LOG
-- ============================================

-- Table: AI Activity Audit Log
-- All autonomous actions logged
CREATE TABLE ai_activity_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Action details
    action_type TEXT NOT NULL, -- 'auto_boost', 'creative_generated', 'discount_sent', 'reminder_sent', etc.
    action_category TEXT NOT NULL, -- 'marketing', 'recovery', 'protection', 'partnership'
    
    -- Actors
    ai_model_version TEXT,
    triggered_by TEXT, -- 'scheduled', 'threshold', 'manual', 'pattern_detected'
    
    -- Target
    target_type TEXT, -- 'venue', 'user', 'booking'
    target_id UUID,
    
    -- Details
    action_details JSONB DEFAULT '{}',
    
    -- Result
    action_result JSONB DEFAULT '{}',
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    
    -- Ownership
    owner_id UUID REFERENCES auth.users(id), -- Venue owner if applicable
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_type ON ai_activity_audit_log(action_type);
CREATE INDEX idx_audit_target ON ai_activity_audit_log(target_type, target_id);
CREATE INDEX idx_audit_created ON ai_activity_audit_log(created_at DESC);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Calculate no-show risk score
CREATE OR REPLACE FUNCTION calculate_no_show_risk(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_total_bookings INTEGER := 0;
    v_completed INTEGER := 0;
    v_no_shows INTEGER := 0;
    v_cancellations INTEGER := 0;
    v_risk_score INTEGER := 0;
    v_risk_level TEXT := 'low';
BEGIN
    -- Get booking stats
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'completed'),
        COUNT(*) FILTER (WHERE status = 'no_show'),
        COUNT(*) FILTER (WHERE status = 'cancelled')
    INTO v_total_bookings, v_completed, v_no_shows, v_cancellations
    FROM bookings
    WHERE user_id = p_user_id;
    
    IF v_total_bookings = 0 THEN
        RETURN jsonb_build_object(
            'risk_score', 0,
            'risk_level', 'low',
            'requires_deposit', false
        );
    END IF;
    
    -- Calculate risk score
    v_risk_score := ROUND(
        (v_no_shows::FLOAT / NULLIF(v_total_bookings, 0) * 50) +
        (v_cancellations::FLOAT / NULLIF(v_total_bookings, 0) * 30) +
        (CASE WHEN v_no_shows > 2 THEN 20 ELSE 0 END)
    );
    
    v_risk_score := LEAST(100, GREATEST(0, v_risk_score));
    
    -- Determine risk level
    IF v_risk_score >= 70 THEN
        v_risk_level := 'high';
    ELSIF v_risk_score >= 40 THEN
        v_risk_level := 'medium';
    ELSE
        v_risk_level := 'low';
    END IF;
    
    -- Update profile
    UPDATE no_show_risk_profiles SET
        no_show_score = v_risk_score,
        risk_level = v_risk_level,
        total_bookings = v_total_bookings,
        completed_bookings = v_completed,
        no_show_count = v_no_shows,
        cancellation_count = v_cancellations,
        requires_deposit = v_risk_level = 'high',
        deposit_percentage = CASE WHEN v_risk_level = 'high' THEN 50 ELSE 0 END,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Insert if not exists
    IF NOT FOUND THEN
        INSERT INTO no_show_risk_profiles (
            user_id,
            no_show_score,
            risk_level,
            total_bookings,
            completed_bookings,
            no_show_count,
            cancellation_count,
            requires_deposit,
            deposit_percentage
        ) VALUES (
            p_user_id,
            v_risk_score,
            v_risk_level,
            v_total_bookings,
            v_completed,
            v_no_shows,
            v_cancellations,
            v_risk_level = 'high',
            CASE WHEN v_risk_level = 'high' THEN 50 ELSE 0 END
        );
    END IF;
    
    RETURN jsonb_build_object(
        'risk_score', v_risk_score,
        'risk_level', v_risk_level,
        'requires_deposit', v_risk_level = 'high',
        'deposit_percentage', CASE WHEN v_risk_level = 'high' THEN 50 ELSE 0 END
    );
END;
$$ LANGUAGE plpgsql;

-- Function: Detect negative review and trigger recovery
CREATE OR REPLACE FUNCTION handle_negative_review(
    p_venue_id UUID,
    p_review_id UUID,
    p_user_id UUID,
    p_rating INTEGER,
    p_review_text TEXT,
    p_source TEXT
)
RETURNS UUID AS $$
DECLARE
    v_alert_id UUID;
    v_coupon_code TEXT;
    v_discount INTEGER;
BEGIN
    -- Only trigger for ratings below 3
    IF p_rating >= 3 THEN
        RETURN NULL;
    END IF;
    
    -- Determine severity
    DECLARE v_severity TEXT := 'medium';
    BEGIN
        IF p_rating = 1 THEN
            v_severity := 'critical';
        ELSIF p_rating = 2 THEN
            v_severity := 'high';
        END IF;
    END;
    
    -- Determine discount
    v_discount := CASE 
        WHEN p_rating = 1 THEN 25
        WHEN p_rating = 2 THEN 20
        ELSE 15
    END;
    
    -- Generate coupon code
    v_coupon_code := 'RESCUE' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    
    -- Create crisis alert
    INSERT INTO crisis_alerts (
        venue_id,
        review_id,
        user_id,
        alert_type,
        severity,
        rating,
        review_text,
        review_source
    ) VALUES (
        p_venue_id,
        p_review_id,
        p_user_id,
        'negative_review',
        v_severity,
        p_rating,
        p_review_text,
        p_source
    )
    RETURNING id INTO v_alert_id;
    
    -- Auto-generate peace offering coupon
    INSERT INTO peace_offering_coupons (
        crisis_alert_id,
        venue_id,
        user_id,
        coupon_code,
        discount_percentage,
        valid_hours,
        expires_at
    ) VALUES (
        v_alert_id,
        p_venue_id,
        p_user_id,
        v_coupon_code,
        v_discount,
        48,
        NOW() + INTERVAL '48 hours'
    );
    
    -- Log autonomous action
    INSERT INTO ai_activity_audit_log (
        action_type,
        action_category,
        triggered_by,
        target_type,
        target_id,
        action_details,
        owner_id
    ) VALUES (
        'peace_offering_generated',
        'recovery',
        'threshold',
        'user',
        p_user_id,
        jsonb_build_object(
            'rating', p_rating,
            'discount', v_discount,
            'coupon_code', v_coupon_code
        ),
        (SELECT owner_id FROM venues WHERE id = p_venue_id)
    );
    
    RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Schedule booking reminders
CREATE OR REPLACE FUNCTION schedule_booking_reminders(p_booking_id UUID)
RETURNS VOID AS $$
DECLARE
    v_booking_time TIMESTAMPTZ;
    v_user_id UUID;
BEGIN
    -- Get booking details
    SELECT user_id, booking_time INTO v_user_id, v_booking_time
    FROM bookings WHERE id = p_booking_id;
    
    -- Schedule 3-hour reminder
    INSERT INTO booking_reminders (
        booking_id,
        user_id,
        reminder_type,
        scheduled_for,
        message_text
    ) VALUES (
        p_booking_id,
        v_user_id,
        'reminder_3h',
        v_booking_time - INTERVAL '3 hours',
        'Hey! Your booking is in 3 hours. See you soon! 👋'
    );
    
    -- Schedule 1-hour reminder
    INSERT INTO booking_reminders (
        booking_id,
        user_id,
        reminder_type,
        scheduled_for,
        message_text
    ) VALUES (
        p_booking_id,
        v_user_id,
        'reminder_1h',
        v_booking_time - INTERVAL '1 hour',
        '⌛ 1 hour until your reservation! We can''t wait to see you!'
    );
    
    -- Schedule 30-min reminder
    INSERT INTO booking_reminders (
        booking_id,
        user_id,
        reminder_type,
        scheduled_for,
        message_text
    ) VALUES (
        p_booking_id,
        v_user_id,
        'reminder_30m',
        v_booking_time - INTERVAL '30 minutes',
        '🚪 Almost time! We have your table ready. See you soon!'
    );
END;
$$ LANGUAGE plpgsql;

-- Function: Generate recovery bundle for user journey
CREATE OR REPLACE FUNCTION detect_and_trigger_journey_recovery(
    p_user_id UUID,
    p_current_venue_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    v_current_category TEXT;
    v_target_pattern RECORD;
    v_bundle_id UUID;
    v_sent_count INTEGER := 0;
BEGIN
    -- Get current venue category
    SELECT category INTO v_current_category
    FROM venues WHERE id = p_current_venue_id;
    
    -- Find matching journey patterns
    FOR v_target_pattern IN
        SELECT id, target_venue_category, discount_percentage
        FROM user_journey_patterns
        WHERE source_venue_category = v_current_category
          AND is_active = true
          AND conversion_rate > 0.1
    LOOP
        -- Find target venues
        DECLARE v_target_venue RECORD;
        BEGIN
            FOR v_target_venue IN
                SELECT id FROM venues
                WHERE category = v_target_pattern.target_venue_category
                  AND is_active = true
                LIMIT 1
            LOOP
                -- Check if user has used similar venues
                IF EXISTS (
                    SELECT 1 FROM checkins
                    WHERE user_id = p_user_id
                      AND venue_id = v_current_venue_id
                      AND DATE(timestamp) >= CURRENT_DATE - INTERVAL '7 days'
                ) THEN
                    -- Create and send recovery bundle (simplified)
                    v_sent_count := v_sent_count + 1;
                END IF;
            END LOOP;
        END;
    END LOOP;
    
    RETURN v_sent_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE auto_generated_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsored_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE peace_offering_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE no_show_risk_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_deposit_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_journey_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_delivery_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_query_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_activity_audit_log ENABLE ROW LEVEL SECURITY;

-- Creatives: Owners manage own
CREATE POLICY "Owners manage own creatives" ON auto_generated_creatives
    FOR ALL USING (
        venue_id IN (SELECT id FROM venues WHERE owner_id = auth.uid())
    );

-- Crisis alerts: Owners view own
CREATE POLICY "Owners view own crisis" ON crisis_alerts
    FOR SELECT USING (
        venue_id IN (SELECT id FROM venues WHERE owner_id = auth.uid())
    );

-- Peace offerings: Users view own
CREATE POLICY "Users view own peace offerings" ON peace_offering_coupons
    FOR SELECT USING (user_id = auth.uid());

-- No-show profiles: Users view own
CREATE POLICY "Users view own noshow profile" ON no_show_risk_profiles
    FOR SELECT USING (user_id = auth.uid());

-- Booking deposits: Users view own
CREATE POLICY "Users view own deposits" ON booking_deposit_requirements
    FOR SELECT USING (user_id = auth.uid());

-- Voice queries: Users view own
CREATE POLICY "Users view own voice queries" ON voice_query_sessions
    FOR SELECT USING (user_id = auth.uid());

-- Audit log: Service/Admin only
CREATE POLICY "Admin view audit log" ON ai_activity_audit_log
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
        OR owner_id = auth.uid()
    );

-- Recovery bundles: Public can read active
CREATE POLICY "Anyone view active bundles" ON recovery_bundles
    FOR SELECT USING (status = 'active');
