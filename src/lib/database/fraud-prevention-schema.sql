-- ============================================
-- PHASE 5.3: FRAUD PREVENTION & OPERATIONAL INTELLIGENCE
-- AI Anti-Fraud Shield, Revenue Matcher, Ops-Intelligence
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. AI ANTI-FRAUD SHIELD
-- ============================================

-- Table: User Trust Scores
-- AI-computed trust score for each user
CREATE TABLE user_trust_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    
    -- Trust components
    trust_score INTEGER DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
    trust_level TEXT DEFAULT 'standard' CHECK (trust_level IN ('new', 'standard', 'verified', 'trusted', 'vip')),
    
    -- Component scores
    identity_verification_score INTEGER DEFAULT 0, -- 0-100
    checkin_reliability_score INTEGER DEFAULT 50, -- 0-100
    review_authenticity_score INTEGER DEFAULT 50, -- 0-100
    payment_reliability_score INTEGER DEFAULT 50, -- 0-100
    social_connection_score INTEGER DEFAULT 50, -- 0-100
    
    -- Risk factors
    risk_flags JSONB DEFAULT '[]', -- ['vpn_detected', 'gps_spoofing', 'bot_pattern']
    last_risk_check TIMESTAMPTZ,
    
    -- Verification status
    is_identity_verified BOOLEAN DEFAULT false,
    verification_method TEXT, -- 'nfc', 'qr', 'manual'
    verified_at TIMESTAMPTZ,
    
    -- Last updated
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trust_scores_user ON user_trust_scores(user_id);
CREATE INDEX idx_trust_scores_level ON user_trust_scores(trust_level);

-- Table: Review Fraud Detection
-- AI-analyzed fraud flags for reviews
CREATE TABLE review_fraud_detection (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL,
    review_type TEXT NOT NULL, -- 'vibe_check', 'google', 'tripadvisor'
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Fraud detection results
    fraud_score FLOAT DEFAULT 0.0, -- 0-1 probability
    is_suspicious BOOLEAN DEFAULT false,
    
    -- Detection flags
    detection_reasons JSONB DEFAULT '[]', -- ['identical_text', 'vpn_detected', 'bot_pattern', 'velocity_anomaly']
    
    -- Pattern detection
    text_similarity_score FLOAT, -- Similarity to other reviews
    ip_address TEXT,
    device_fingerprint TEXT,
    vpn_detected BOOLEAN DEFAULT false,
    gps_anomaly BOOLEAN DEFAULT false,
    
    -- Geolocation check
    checkin_location JSONB, -- { lat, lng }
    review_location JSONB, -- { lat, lng }
    location_distance_km FLOAT,
    
    -- Velocity check
    reviews_same_day INTEGER DEFAULT 0,
    reviews_same_venue_group INTEGER DEFAULT 0,
    
    -- AI decision
    ai_decision TEXT CHECK (ai_decision IN ('approved', 'flagged', 'rejected', 'pending_review')),
    ai_confidence FLOAT DEFAULT 0.0,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'hidden', 'restored')),
    
    -- Restoration (for false positives)
    restoration_method TEXT, -- 'nfc_proof', 'qr_proof', 'manual_review'
    restored_at TIMESTAMPTZ,
    
    -- Timestamps
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

CREATE INDEX idx_fraud_review ON review_fraud_detection(review_id);
CREATE INDEX idx_fraud_venue ON review_fraud_detection(venue_id);
CREATE INDEX idx_fraud_status ON review_fraud_detection(status);
CREATE INDEX idx_fraud_user ON review_fraud_detection(user_id);

-- Table: VPN/GPS Detection Logs
-- Track suspicious connection patterns
CREATE TABLE fraud_detection_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Detection type
    detection_type TEXT NOT NULL, -- 'vpn', 'gps_spoofing', 'bot', 'velocity', 'fake_account'
    
    -- Details
    ip_address TEXT,
    ip_country TEXT,
    is_vpn BOOLEAN DEFAULT false,
    is_proxy BOOLEAN DEFAULT false,
    
    -- Device info
    device_fingerprint TEXT,
    user_agent TEXT,
    
    -- Location anomaly
    reported_location JSONB,
    actual_location JSONB,
    
    -- Activity
    activity_summary JSONB DEFAULT '{}',
    
    -- Timestamps
    detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fraud_logs_user ON fraud_detection_logs(user_id);
CREATE INDEX idx_fraud_logs_type ON fraud_detection_logs(detection_type);
CREATE INDEX idx_fraud_logs_time ON fraud_detection_logs(detected_at DESC);

-- ============================================
-- 2. AUTOMATED COMMISSION RECONCILIATION
-- ============================================

-- Table: Transaction Anomalies
-- AI-detected suspicious transactions
CREATE TABLE transaction_anomalies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Transaction reference
    checkin_id UUID REFERENCES checkins(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Anomaly detection
    anomaly_type TEXT NOT NULL, -- 'zero_invoice', 'low_amount', 'duration_mismatch', 'unreported'
    anomaly_score FLOAT DEFAULT 0.0, -- 0-1 probability
    
    -- Comparison data
    checkin_duration_minutes INTEGER,
    invoice_amount INTEGER,
    expected_minimum_amount INTEGER,
    amount_difference INTEGER,
    percentage_difference FLOAT,
    
    -- User history
    user_avg_spend INTEGER,
    venue_avg_spend INTEGER,
    is_outlier BOOLEAN DEFAULT false,
    
    -- Status
    status TEXT DEFAULT 'detected' CHECK (status IN ('detected', 'investigating', 'confirmed', 'resolved', 'false_positive')),
    
    -- Resolution
    resolution_notes TEXT,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    
    -- Timestamps
    detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_anomalies_venue ON transaction_anomalies(venue_id);
CREATE INDEX idx_anomalies_status ON transaction_anomalies(status);
CREATE INDEX idx_anomalies_type ON transaction_anomalies(anomaly_type);

-- Table: Commission Reconciliation
-- Track commission collection
CREATE TABLE commission_reconciliation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
    
    -- Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Revenue data
    total_invoiced INTEGER DEFAULT 0,
    total_collected INTEGER DEFAULT 0,
    total_pending INTEGER DEFAULT 0,
    total_disputed INTEGER DEFAULT 0,
    
    -- Commission
    commission_rate FLOAT DEFAULT 0.05,
    expected_commission INTEGER,
    collected_commission INTEGER DEFAULT 0,
    
    -- Anomalies
    anomaly_count INTEGER DEFAULT 0,
    unresolved_anomalies INTEGER DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'paid', 'disputed')),
    
    -- Timestamps
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ
);

CREATE INDEX idx_commission_venue ON commission_reconciliation(venue_id, period_start);

-- ============================================
-- 3. STAFFING & SUPPLY SUGGESTIONS
-- ============================================

-- Table: Venue Staffing Recommendations
-- AI-generated staffing suggestions
CREATE TABLE venue_staffing_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
    
    -- Recommendation details
    recommendation_date DATE NOT NULL,
    target_date DATE NOT NULL, -- The date being predicted
    
    -- Predicted metrics
    predicted_occupancy_percentage INTEGER,
    predicted_visitors INTEGER,
    predicted_revenue INTEGER,
    
    -- Staffing recommendations
    recommended_security INTEGER,
    recommended_bar_staff INTEGER,
    recommended_hosts INTEGER,
    recommended_djs INTEGER,
    
    -- Supply recommendations
    recommended_drinks_stock INTEGER, -- in units
    recommended_food_stock INTEGER,
    
    -- Reasoning
    ai_reasoning TEXT,
    
    -- Status
    is_sent BOOLEAN DEFAULT false,
    is_read BOOLEAN DEFAULT false,
    
    -- Timestamps
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ
);

CREATE INDEX idx_staffing_venue_date ON venue_staffing_recommendations(venue_id, target_date);

-- Table: Predicted Capacity Alerts
-- Alerts when capacity exceeds thresholds
CREATE TABLE capacity_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
    
    -- Alert details
    alert_type TEXT NOT NULL, -- 'high_capacity', 'low_capacity', 'staffing_shortage'
    alert_level TEXT DEFAULT 'info' CHECK (alert_level IN ('info', 'warning', 'critical')),
    
    -- Predicted/actual data
    predicted_occupancy INTEGER,
    actual_occupancy INTEGER,
    capacity_percentage INTEGER,
    
    -- Recommendation
    recommendation TEXT,
    
    -- Status
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_capacity_alerts_venue ON capacity_alerts(venue_id, is_resolved);

-- ============================================
-- 4. PERSONALIZED RE-ENGAGEMENT ENGINE
-- ============================================

-- Table: Re-engagement Campaigns
-- AI-generated re-engagement offers
CREATE TABLE reengagement_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Campaign type
    campaign_type TEXT NOT NULL, -- 'miss_you', 'inactive', 'at_risk', 'win_back'
    
    -- Target user
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    user_tier TEXT, -- Their membership tier at time of campaign
    
    -- Targeting criteria
    days_inactive INTEGER,
    last_venue_id UUID REFERENCES venues(id),
    last_venue_category TEXT,
    
    -- Offer details
    discount_percentage INTEGER,
    discount_code TEXT,
    valid_days INTEGER DEFAULT 7,
    
    -- Personalization
    favorite_venue_id UUID REFERENCES venues(id),
    best_friend_ids UUID[] DEFAULT '{}',
    personalized_message TEXT,
    
    -- Status
    status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'sent', 'opened', 'used', 'expired')),
    
    -- Metrics
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ,
    
    -- Timestamps
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX idx_reengagement_user ON reengagement_campaigns(user_id);
CREATE INDEX idx_reengagement_status ON reengagement_campaigns(status);

-- Table: Squad Invite Links
-- Personalized squad invitations
CREATE TABLE squad_invite_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Creator
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
    
    -- Invite details
    invite_token TEXT UNIQUE NOT NULL,
    max_users INTEGER DEFAULT 10,
    current_users INTEGER DEFAULT 1,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_squad_invite_token ON squad_invite_links(invite_token);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Calculate user trust score
CREATE OR REPLACE FUNCTION calculate_user_trust_score(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_score INTEGER := 50;
    v_trust_level TEXT := 'standard';
    v_identity INTEGER := 0;
    v_checkin INTEGER := 50;
    v_review INTEGER := 50;
    v_payment INTEGER := 50;
    v_social INTEGER := 50;
BEGIN
    -- Get identity verification
    SELECT COALESCE(identity_verification_score, 0) INTO v_identity
    FROM user_trust_scores WHERE user_id = p_user_id;
    
    -- Get check-in reliability
    SELECT COALESCE(checkin_reliability_score, 50) INTO v_checkin
    FROM user_trust_scores WHERE user_id = p_user_id;
    
    -- Get review authenticity
    SELECT COALESCE(review_authenticity_score, 50) INTO v_review
    FROM user_trust_scores WHERE user_id = p_user_id;
    
    -- Get payment reliability
    SELECT COALESCE(payment_reliability_score, 50) INTO v_payment
    FROM user_trust_scores WHERE user_id = p_user_id;
    
    -- Get social connection score
    SELECT COALESCE(social_connection_score, 50) INTO v_social
    FROM user_trust_scores WHERE user_id = p_user_id;
    
    -- Weighted calculation
    v_score := ROUND(
        v_identity * 0.25 +
        v_checkin * 0.2 +
        v_review * 0.2 +
        v_payment * 0.2 +
        v_social * 0.15
    );
    
    -- Determine trust level
    IF v_score >= 90 THEN
        v_trust_level := 'vip';
    ELSIF v_score >= 75 THEN
        v_trust_level := 'trusted';
    ELSIF v_score >= 60 THEN
        v_trust_level := 'verified';
    ELSIF v_identity > 0 THEN
        v_trust_level := 'standard';
    ELSE
        v_trust_level := 'new';
    END IF;
    
    -- Update trust score
    UPDATE user_trust_scores SET
        trust_score = v_score,
        trust_level = v_trust_level,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- Function: Detect review fraud patterns
CREATE OR REPLACE FUNCTION detect_review_fraud(
    p_review_id UUID,
    p_venue_id UUID,
    p_user_id UUID,
    p_review_text TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_similar_count INTEGER := 0;
    v_reviews_today INTEGER := 0;
BEGIN
    -- Check for identical text across venues
    SELECT COUNT(*) INTO v_similar_count
    FROM vibe_checks
    WHERE id != p_review_id
      AND comment = p_review_text;
    
    -- Check velocity (reviews today)
    SELECT COUNT(*) INTO v_reviews_today
    FROM vibe_checks
    WHERE user_id = p_user_id
      AND DATE(created_at) = CURRENT_DATE;
    
    -- Build result
    v_result := jsonb_build_object(
        'is_suspicious', v_similar_count > 2 OR v_reviews_today > 5,
        'reasons', (
            CASE WHEN v_similar_count > 2 THEN ARRAY['identical_text'] ELSE ARRAY[]::TEXT[] END ||
            CASE WHEN v_reviews_today > 5 THEN ARRAY['velocity_anomaly'] ELSE ARRAY[]::TEXT[] END
        ),
        'text_similarity_score', CASE WHEN v_similar_count > 0 THEN 1.0 ELSE 0.0 END,
        'reviews_same_day', v_reviews_today
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function: Check transaction anomaly
CREATE OR REPLACE FUNCTION check_transaction_anomaly(
    p_checkin_id UUID,
    p_invoice_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_checkin_duration INTEGER;
    v_invoice_amount INTEGER;
    v_min_expected INTEGER;
    v_is_anomaly BOOLEAN := FALSE;
BEGIN
    -- Get check-in duration
    SELECT EXTRACT(EPOCH FROM (ended_at - started_at))/60 INTO v_checkin_duration
    FROM checkins WHERE id = p_checkin_id;
    
    -- Get invoice amount
    SELECT COALESCE(total_amount, 0) INTO v_invoice_amount
    FROM invoices WHERE id = p_invoice_id;
    
    -- Calculate minimum expected based on duration (50k per hour minimum)
    v_min_expected := GREATEST(50000, (v_checkin_duration / 60)::INTEGER * 50000);
    
    -- Check for anomaly
    IF v_invoice_amount = 0 AND v_checkin_duration > 60 THEN
        v_is_anomaly := TRUE;
    ELSIF v_invoice_amount < v_min_expected * 0.1 THEN
        v_is_anomaly := TRUE;
    END IF;
    
    -- Create anomaly record if detected
    IF v_is_anomaly THEN
        INSERT INTO transaction_anomalies (
            checkin_id,
            invoice_id,
            anomaly_type,
            anomaly_score,
            checkin_duration_minutes,
            invoice_amount,
            expected_minimum_amount,
            amount_difference
        ) VALUES (
            p_checkin_id,
            p_invoice_id,
            CASE WHEN v_invoice_amount = 0 THEN 'zero_invoice' ELSE 'low_amount' END,
            0.8,
            v_checkin_duration,
            v_invoice_amount,
            v_min_expected,
            v_min_expected - v_invoice_amount
        );
    END IF;
    
    RETURN v_is_anomaly;
END;
$$ LANGUAGE plpgsql;

-- Function: Generate staffing recommendation
CREATE OR REPLACE FUNCTION generate_staffing_recommendation(
    p_venue_id UUID,
    p_target_date DATE
)
RETURNS UUID AS $$
DECLARE
    v_predicted_occupancy INTEGER;
    v_recommendation_id UUID;
BEGIN
    -- Get predicted occupancy
    SELECT predicted_occupancy INTO v_predicted_occupancy
    FROM venue_occupancy_predictions
    WHERE venue_id = p_venue_id
      AND DATE(prediction_time) = p_target_date
    ORDER BY predicted_occupancy DESC
    LIMIT 1;
    
    -- Default to 50% if no prediction
    v_predicted_occupancy := COALESCE(v_predicted_occupancy, 50);
    
    -- Insert recommendation
    INSERT INTO venue_staffing_recommendations (
        venue_id,
        recommendation_date,
        target_date,
        predicted_occupancy_percentage,
        predicted_visitors,
        recommended_security,
        recommended_bar_staff,
        recommended_hosts,
        ai_reasoning
    ) VALUES (
        p_venue_id,
        CURRENT_DATE,
        p_target_date,
        v_predicted_occupancy,
        v_predicted_occupancy * 10, -- Assume 10% of capacity
        CASE 
            WHEN v_predicted_occupancy >= 80 THEN 4
            WHEN v_predicted_occupancy >= 60 THEN 3
            ELSE 2
        END,
        CASE 
            WHEN v_predicted_occupancy >= 80 THEN 6
            WHEN v_predicted_occupancy >= 60 THEN 4
            ELSE 2
        END,
        CASE 
            WHEN v_predicted_occupancy >= 80 THEN 3
            WHEN v_predicted_occupancy >= 60 THEN 2
            ELSE 1
        END,
        CASE
            WHEN v_predicted_occupancy >= 80 THEN 'High capacity expected. Increase all staff by 20%.'
            WHEN v_predicted_occupancy >= 60 THEN 'Moderate capacity. Standard staffing sufficient.'
            ELSE 'Low capacity expected. Consider reduced staffing.'
        END
    )
    RETURNING id INTO v_recommendation_id;
    
    RETURN v_recommendation_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Generate re-engagement campaign
CREATE OR REPLACE FUNCTION generate_reengagement_campaign(
    p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_campaign_id UUID;
    v_days_inactive INTEGER;
    v_last_venue_id UUID;
    v_user_tier TEXT;
    v_favorite_venue_id UUID;
    v_discount INTEGER := 15;
BEGIN
    -- Get user inactivity
    SELECT 
        EXTRACT(DAY FROM NOW() - MAX(c.timestamp))::INTEGER,
        MAX(c.venue_id),
        p.membership_tier
    INTO v_days_inactive, v_last_venue_id, v_user_tier
    FROM checkins c
    JOIN profiles p ON p.id = c.user_id
    WHERE c.user_id = p_user_id
    GROUP BY p.membership_tier;
    
    -- Only create if inactive for 14+ days
    IF v_days_inactive < 14 THEN
        RETURN NULL;
    END IF;
    
    -- Get favorite venue (most visited)
    SELECT venue_id INTO v_favorite_venue_id
    FROM checkins
    WHERE user_id = p_user_id
    GROUP BY venue_id
    ORDER BY COUNT(*) DESC
    LIMIT 1;
    
    -- Adjust discount based on tier
    v_discount := CASE 
        WHEN v_user_tier = 'platinum' THEN 25
        WHEN v_user_tier = 'gold' THEN 20
        WHEN v_user_tier = 'silver' THEN 15
        ELSE 10
    END;
    
    -- Generate campaign
    INSERT INTO reengagement_campaigns (
        user_id,
        user_tier,
        campaign_type,
        days_inactive,
        last_venue_id,
        favorite_venue_id,
        discount_percentage,
        valid_days,
        personalized_message,
        expires_at
    ) VALUES (
        p_user_id,
        v_user_tier,
        'miss_you',
        v_days_inactive,
        v_last_venue_id,
        v_favorite_venue_id,
        v_discount,
        7,
        'We miss you! Here\'s a special discount just for you.',
        NOW() + INTERVAL '7 days'
    )
    RETURNING id INTO v_campaign_id;
    
    RETURN v_campaign_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE user_trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_fraud_detection ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_detection_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_reconciliation ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_staffing_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE capacity_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reengagement_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_invite_links ENABLE ROW LEVEL SECURITY;

-- Trust scores: Users view own
CREATE POLICY "Users view own trust score" ON user_trust_scores
    FOR SELECT USING (user_id = auth.uid());

-- Fraud detection: Service role manages
CREATE POLICY "Service manage fraud" ON review_fraud_detection
    FOR ALL USING (auth.role() = 'service_role');

-- Fraud logs: Service role only
CREATE POLICY "Service manage fraud logs" ON fraud_detection_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Transaction anomalies: Admin/Venue owner view
CREATE POLICY "Admins view all anomalies" ON transaction_anomalies
    FOR SELECT USING (
        auth.uid() IN (SELECT owner_id FROM venues WHERE id = venue_id)
        OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    );

-- Commission: Venue owners view own
CREATE POLICY "Owners view own commission" ON commission_reconciliation
    FOR SELECT USING (
        venue_id IN (SELECT id FROM venues WHERE owner_id = auth.uid())
    );

-- Staffing: Venue owners view own
CREATE POLICY "Owners view own staffing" ON venue_staffing_recommendations
    FOR SELECT USING (
        venue_id IN (SELECT id FROM venues WHERE owner_id = auth.uid())
    );

-- Re-engagement: Users view own
CREATE POLICY "Users view own reengagement" ON reengagement_campaigns
    FOR SELECT USING (user_id = auth.uid());

-- Squad invites: Anyone with token
CREATE POLICY "Anyone use squad invite" ON squad_invite_links
    FOR SELECT USING (is_active = true);
