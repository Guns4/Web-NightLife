-- ============================================
-- PHASE 7.5: DATA SOVEREIGNTY & PREDICTIVE ECONOMICS
-- Advanced Analytics & Revenue Multiplication
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
// 7.5.1: PREDICTIVE INVENTORY FORECASTING
// ============================================

-- Table: Inventory Items
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
    
    -- Item details
    item_name TEXT NOT NULL,
    brand_name TEXT,
    category TEXT NOT NULL, -- 'spirit', 'beer', 'wine', 'cocktail', 'food'
    unit_type TEXT DEFAULT 'bottle', -- 'bottle', 'glass', 'keg', 'pack'
    initial_stock INTEGER NOT NULL,
    current_stock INTEGER NOT NULL,
    
    -- Cost & pricing
    cost_per_unit INTEGER NOT NULL,
    price_per_unit INTEGER NOT NULL,
    
    -- Thresholds
    low_stock_alert INTEGER DEFAULT 10,
    critical_stock_alert INTEGER DEFAULT 5,
    
    -- AI Predictions
    avg_daily_consumption FLOAT DEFAULT 0,
    predicted_stockout_date TIMESTAMPTZ,
    confidence_score FLOAT DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Inventory Alerts
CREATE TABLE inventory_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
    inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE NOT NULL,
    
    -- Alert details
    alert_type TEXT NOT NULL, -- 'low_stock', 'critical_stock', 'predicted_stockout', 'expiring'
    message TEXT NOT NULL,
    severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    
    -- Suggested action
    suggested_action TEXT,
    suggested_promo BOOLEAN DEFAULT false,
    alternative_brand_id UUID,
    
    -- Status
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
// 7.5.2: BEHAVIORAL COHORT ANALYTICS
// ============================================

-- Table: Attribution Journeys
CREATE TABLE attribution_journeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_hash TEXT,
    
    -- Journey touchpoints
    touchpoints JSONB NOT NULL DEFAULT '[]', -- [{type, timestamp, source, campaign_id, venue_id, drink_ordered}]
    
    -- Conversion
    conversion_type TEXT, -- 'checkin', 'purchase', 'booking'
    conversion_venue_id UUID REFERENCES venues(id),
    conversion_value INTEGER,
    
    -- Attribution
    attributed_channel TEXT,
    attributed_campaign_id UUID,
    cost_per_verified_sip DECIMAL(10, 2), -- Revenue / Total touches
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Cohort Analysis
CREATE TABLE cohort_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Cohort definition
    cohort_name TEXT NOT NULL,
    cohort_type TEXT NOT NULL, -- 'behavioral', 'demographic', 'temporal'
    cohort_criteria JSONB NOT NULL,
    
    -- Time period
    cohort_date DATE NOT NULL,
    analysis_period_days INTEGER DEFAULT 30,
    
    -- Metrics
    user_count INTEGER DEFAULT 0,
    total_revenue INTEGER DEFAULT 0,
    avg_revenue_per_user DECIMAL(12, 2) DEFAULT 0,
    conversion_rate FLOAT DEFAULT 0,
    retention_rate FLOAT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
// 7.5.3: PROGRAMMATIC VIBE-AD EXCHANGE
// ============================================

-- Table: Vibe Ad Inventory
CREATE TABLE vibe_ad_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Source
    source_type TEXT NOT NULL, -- 'live_vibe', 'story', 'checkin'
    source_id UUID NOT NULL,
    
    -- Viral metrics
    view_count INTEGER DEFAULT 0,
    velocity_per_minute FLOAT DEFAULT 0, -- views per minute
    is_viral BOOLEAN DEFAULT false,
    viral_threshold INTEGER DEFAULT 500,
    
    -- Auction
    is_auction_open BOOLEAN DEFAULT false,
    auction_start TIMESTAMPTZ,
    auction_end TIMESTAMPTZ,
    winning_bid_id UUID,
    
    status TEXT DEFAULT 'available', -- 'available', 'in_auction', 'sold', 'expired'
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Vibe Ad Bids
CREATE TABLE vibe_ad_bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID REFERENCES vibe_ad_inventory(id) ON DELETE CASCADE NOT NULL,
    brand_id UUID REFERENCES brand_accounts(id) ON DELETE CASCADE NOT NULL,
    
    -- Bid details
    bid_amount INTEGER NOT NULL,
    bid_currency TEXT DEFAULT 'IDR',
    
    -- Creative
    creative_url TEXT,
    overlay_text TEXT,
    coupon_code TEXT,
    
    status TEXT DEFAULT 'pending', -- 'pending', 'winning', 'outbid', 'rejected'
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Vibe Ad Impressions
CREATE TABLE vibe_ad_impressions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bid_id UUID REFERENCES vibe_ad_bids(id),
    inventory_id UUID REFERENCES vibe_ad_inventory(id),
    
    -- User
    user_session_hash TEXT,
    
    -- Metrics
    impressions INTEGER DEFAULT 1,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
// 7.5.4: PERSONALIZED DYNAMIC OFFERS
// ============================================

-- Table: User Price Elasticity
CREATE TABLE user_price_elasticity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    
    -- Elasticity scores (0-1)
    price_sensitivity_score FLOAT DEFAULT 0.5,
    exclusivity_preference_score FLOAT DEFAULT 0.5,
    brand_loyalty_score FLOAT DEFAULT 0.5,
    
    -- Segment
    price_segment TEXT DEFAULT 'medium', -- 'budget', 'medium', 'premium', 'luxury'
    
    -- Behavior
    avg_basket_size INTEGER DEFAULT 0,
    preferred_price_point INTEGER,
    response_to_discounts FLOAT DEFAULT 0,
    response_to_exclusivity FLOAT DEFAULT 0,
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Personalized Offers
CREATE TABLE personalized_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Offer details
    offer_type TEXT NOT NULL, -- 'discount', 'exclusive', 'bogo', 'happy_hour_ext'
    offer_title TEXT NOT NULL,
    offer_description TEXT,
    
    -- Targeting
    target_venue_ids UUID[],
    target_category TEXT,
    min_user_tier TEXT, -- 'bronze', 'silver', 'gold', 'platinum'
    
    -- Pricing
    discount_percentage INTEGER,
    original_price INTEGER,
    personalized_price INTEGER,
    
    -- Eligibility
    elasticity_triggered BOOLEAN DEFAULT false,
    user_segment TEXT,
    
    -- Expiry
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    
    -- Tracking
    is_shown BOOLEAN DEFAULT false,
    is_redeemed BOOLEAN DEFAULT false,
    redeemed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
// 7.5.5: DATA SYNDICATION API
// ============================================

-- Table: API Subscriptions
CREATE TABLE api_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Subscriber
    organization_name TEXT NOT NULL,
    organization_type TEXT NOT NULL, -- 'fintech', 'lifestyle', 'developer'
    contact_email TEXT NOT NULL,
    
    -- Plan
    tier TEXT DEFAULT 'free', -- 'free', 'professional', 'enterprise'
    monthly_rate INTEGER DEFAULT 0,
    
    -- Access
    api_key TEXT UNIQUE NOT NULL,
    api_secret_hash TEXT,
    rate_limit INTEGER DEFAULT 1000,
    current_usage INTEGER DEFAULT 0,
    
    -- ZKP
    zkp_enabled BOOLEAN DEFAULT false,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: API Access Logs
CREATE TABLE api_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES api_subscriptions(id) ON DELETE CASCADE NOT NULL,
    
    -- Request
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    request_params JSONB DEFAULT '{}',
    
    -- Response
    response_status INTEGER,
    response_time_ms INTEGER,
    
    -- Data accessed
    data_types JSONB DEFAULT '[]',
    records_returned INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
// 7.5.6: SENTIMENT REPUTATION INDEX
// ============================================

-- Table: District Vibe Indices
CREATE TABLE district_vibe_indices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Location
    district TEXT NOT NULL,
    city_id UUID REFERENCES cities(id),
    
    -- Date
    date DATE NOT NULL,
    
    -- Indices (0-100)
    overall_vibe_index FLOAT DEFAULT 50,
    safety_index FLOAT DEFAULT 50,
    energy_index FLOAT DEFAULT 50,
    exclusivity_index FLOAT DEFAULT 50,
    value_index FLOAT DEFAULT 50,
    
    -- Components
    avg_venue_rating FLOAT,
    avg_spending DECIMAL(12, 2),
    foot_traffic_index FLOAT,
    new_venue_opening_rate FLOAT,
    
    -- Projections
    predicted_next_week FLOAT,
    trend_direction TEXT DEFAULT 'stable', -- 'rising', 'falling', 'stable'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(district, date)
);

-- Table: Commercial Real Estate Insights
CREATE TABLE commercial_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Location
    district TEXT NOT NULL,
    city_id UUID REFERENCES cities(id),
    latitude FLOAT,
    longitude FLOAT,
    
    -- Market data
    avg_foot_traffic INTEGER,
    avg_venue_revenue INTEGER,
    competition_density FLOAT, -- venues per sq km
    demographic_score FLOAT, -- 0-100
    
    -- Investment metrics
    commercial_rent_estimate INTEGER,
    roi_projection_1yr DECIMAL(5, 2),
    roi_projection_3yr DECIMAL(5, 2),
    
    -- Recommendations
    recommended_categories TEXT[],
    opportunity_score FLOAT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
// 7.5.7: AUDIT TRAIL
// ============================================

-- Table: Immutable Audit Log (Blockchain-like)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event
    event_type TEXT NOT NULL, -- 'data_access', 'data_export', 'consent_change', 'score_update'
    
    -- Actor
    actor_type TEXT NOT NULL, -- 'brand', 'user', 'admin', 'api'
    actor_id TEXT NOT NULL,
    
    -- Target
    target_type TEXT NOT NULL,
    target_id TEXT,
    
    -- Action
    action_description TEXT NOT NULL,
    data_accessed JSONB DEFAULT '{}',
    
    -- Proof
    previous_hash TEXT,
    current_hash TEXT NOT NULL,
    nonce INTEGER DEFAULT 0,
    
    -- Metadata
    ip_address TEXT,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
// FUNCTIONS
// ============================================

-- Function: Calculate predicted stockout
CREATE OR REPLACE FUNCTION predict_stockout(
    p_item_id UUID
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
    v_item RECORD;
    v_consumption_rate FLOAT;
    v_current_stock INTEGER;
    v_prediction TIMESTAMPTZ;
BEGIN
    -- Get item
    SELECT * INTO v_item FROM inventory_items WHERE id = p_item_id;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Get consumption rate (from recent data)
    SELECT COALESCE(avg_daily_consumption, 0) INTO v_consumption_rate
    FROM inventory_items WHERE id = p_item_id;
    
    -- Default to recent average if not set
    IF v_consumption_rate = 0 THEN
        v_consumption_rate := 10; -- Default assumption
    END IF;
    
    -- Calculate stockout time
    v_current_stock := v_item.current_stock;
    
    -- Predict based on hourly rate (assume evening peak)
    v_prediction := NOW() + (v_current_stock / (v_consumption_rate / 24)) * INTERVAL '1 hour';
    
    -- Update prediction
    UPDATE inventory_items SET
        predicted_stockout_date = v_prediction,
        confidence_score = 0.75
    WHERE id = p_item_id;
    
    RETURN v_prediction;
END;
$$ LANGUAGE plpgsql;

-- Function: Generate audit hash
CREATE OR REPLACE FUNCTION generate_audit_hash(
    p_event_type TEXT,
    p_actor_id TEXT,
    p_target_id TEXT,
    p_timestamp TIMESTAMPTZ,
    p_prev_hash TEXT
)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(
        gen_random_bytes(32),
        'hex'
    );
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate price elasticity score
CREATE OR REPLACE FUNCTION calculate_price_elasticity(
    p_user_id UUID
)
RETURNS FLOAT AS $$
DECLARE
    v_transactions INTEGER;
    v_total_spent INTEGER;
    v_discount_uses INTEGER;
    v_exclusive_uses INTEGER;
    v_elasticity FLOAT;
BEGIN
    -- Get user transaction data (last 90 days)
    SELECT 
        COUNT(*),
        COALESCE(SUM(total_amount), 0),
        COALESCE(SUM(CASE WHEN discount_applied > 0 THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN is_exclusive_booking THEN 1 ELSE 0 END), 0)
    INTO v_transactions, v_total_spent, v_discount_uses, v_exclusive_uses
    FROM bookings
    WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '90 days';
    
    IF v_transactions = 0 THEN
        RETURN 0.5; -- Default
    END IF;
    
    -- Calculate elasticity score (0 = very price sensitive, 1 = not price sensitive)
    v_elasticity := (
        (v_exclusive_uses::FLOAT / v_transactions) * 0.6 +
        (v_discount_uses::FLOAT / v_transactions) * -0.4 +
        ((v_total_spent / v_transactions)::FLOAT / 1000000) * 0.3 +
        0.5
    );
    
    -- Clamp to 0-1
    RETURN GREATEST(0, LEAST(1, v_elasticity));
END;
$$ LANGUAGE plpgsql;

-- Function: Trigger vibe-ad auction
CREATE OR REPLACE FUNCTION trigger_vibe_ad_auction(
    p_source_type TEXT,
    p_source_id UUID,
    p_view_velocity FLOAT
)
RETURNS UUID AS $$
DECLARE
    v_inventory_id UUID;
    v_threshold INTEGER := 500;
BEGIN
    -- Check if viral
    IF p_view_velocity * 60 >= v_threshold THEN -- per minute * 60 = per hour
        -- Create inventory
        INSERT INTO vibe_ad_inventory (
            source_type,
            source_id,
            view_count,
            velocity_per_minute,
            is_viral,
            is_auction_open,
            auction_start,
            auction_end,
            status
        ) VALUES (
            p_source_type,
            p_source_id,
            0,
            p_view_velocity,
            true,
            true,
            NOW(),
            NOW() + INTERVAL '30 minutes',
            'in_auction'
        )
        RETURNING id INTO v_inventory_id;
        
        RETURN v_inventory_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
// RLS POLICIES
// ============================================

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribution_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_ad_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_ad_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_ad_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_price_elasticity ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalized_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE district_vibe_indices ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Inventory: Venue owners manage
CREATE POLICY "Owners manage inventory" ON inventory_items FOR ALL USING (
    venue_id IN (SELECT id FROM venues WHERE owner_id = auth.uid())
);

-- Alerts: Venue owners view
CREATE POLICY "Owners view alerts" ON inventory_alerts FOR ALL USING (
    venue_id IN (SELECT id FROM venues WHERE owner_id = auth.uid())
);

-- Price elasticity: User view own
CREATE POLICY "Users view own elasticity" ON user_price_elasticity FOR SELECT USING (
    user_id = auth.uid()
);

-- Personalized offers: User view own
CREATE POLICY "Users view own offers" ON personalized_offers FOR SELECT USING (
    user_id = auth.uid()
);

-- Audit logs: Admin only
CREATE POLICY "Admin view audit" ON audit_logs FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- District indices: Public read
CREATE POLICY "Public read district" ON district_vibe_indices FOR SELECT USING (true);

-- Commercial insights: Public read
CREATE POLICY "Public read commercial" ON commercial_insights FOR SELECT USING (true);

-- API subscriptions: Admin manage
CREATE POLICY "Admin manage api" ON api_subscriptions FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);
