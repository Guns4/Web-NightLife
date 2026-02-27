-- ============================================
-- PHASE 7: THE DATA GOLDMINE
-- Analytics Warehouse & Monetization
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
// 7.1: ANALYTICS HUB
// ============================================

-- Table: Aggregated Consumption Trends
CREATE TABLE consumption_trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Time dimension
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
    
    -- Location
    city_id UUID REFERENCES cities(id),
    district TEXT,
    
    -- Category
    category TEXT NOT NULL, -- 'spirit', 'beer', 'wine', 'cocktail', 'mocktail'
    brand_id UUID, -- Reference to brand if applicable
    
    -- Metrics
    total_units INTEGER DEFAULT 0,
    total_revenue INTEGER DEFAULT 0,
    avg_price INTEGER DEFAULT 0,
    trend_direction TEXT DEFAULT 'stable', -- 'rising', 'falling', 'stable'
    trend_percentage FLOAT DEFAULT 0,
    
    -- Metadata
    is_anonymized BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consumption_trends ON consumption_trends(period_start, city_id, category);

-- Table: Peak Flow Heatmaps
CREATE TABLE peak_flow_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Time
    hour_of_day INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL,
    date DATE NOT NULL,
    
    -- Location grid (lat/lng buckets)
    grid_cell TEXT NOT NULL, -- Format: "lat_lng_bucket"
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    
    -- Metrics
    total_visitors INTEGER DEFAULT 0,
    total_checkins INTEGER DEFAULT 0,
    avg_dwell_time_minutes INTEGER DEFAULT 0,
    
    -- Movement
    inflow_from_venues UUID[] DEFAULT '{}',
    outflow_to_venues UUID[] DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(hour_of_day, day_of_week, grid_cell, date)
);

CREATE INDEX idx_peak_flow ON peak_flow_data(date, grid_cell);

-- Table: User Personas (Anonymized Clusters)
CREATE TABLE user_personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Cluster info
    cluster_id INTEGER NOT NULL,
    cluster_name TEXT NOT NULL, -- 'high_spender', 'trendsetter', 'budget', 'regular'
    
    -- Anonymized traits
    avg_spend_per_visit INTEGER,
    visit_frequency_per_month INTEGER,
    preferred_categories TEXT[],
    preferred_time_slots INTEGER[],
    preferred_locations TEXT[],
    
    -- Size
    user_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(cluster_id)
);

-- ============================================
// 7.2: BRAND PORTAL (FMCG)
// ============================================

-- Table: Brand Accounts
CREATE TABLE brand_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Brand info
    brand_name TEXT NOT NULL,
    brand_logo_url TEXT,
    industry TEXT NOT NULL, -- 'spirit', 'beer', 'wine', 'non_alcoholic'
    
    -- Contact
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    account_manager_name TEXT,
    
    -- Subscription
    subscription_tier TEXT DEFAULT 'basic', -- 'basic', 'premium', 'enterprise'
    subscription_expires DATE,
    
    -- Access
    api_access_key TEXT UNIQUE,
    api_secret_hash TEXT,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Market Share Data
CREATE TABLE market_share_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brand_accounts(id) ON DELETE CASCADE NOT NULL,
    
    -- Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Category
    category TEXT NOT NULL,
    city_id UUID REFERENCES cities(id),
    
    -- Share metrics
    units_sold INTEGER DEFAULT 0,
    revenue INTEGER DEFAULT 0,
    market_share_percentage FLOAT DEFAULT 0,
    rank_in_category INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(brand_id, category, city_id, period_start)
);

-- Table: Flash Promos (Brand Activations)
CREATE TABLE flash_promos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brand_accounts(id) ON DELETE CASCADE NOT NULL,
    
    -- Promo details
    promo_name TEXT NOT NULL,
    promo_description TEXT,
    discount_percentage INTEGER,
    free_sample_quantity INTEGER,
    
    -- Targeting
    target_venue_ids UUID[],
    target_city_ids UUID[],
    target_user_clusters INTEGER[],
    radius_km FLOAT DEFAULT 5,
    
    -- Timing
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    
    -- Budget
    max_redemptions INTEGER,
    current_redemptions INTEGER DEFAULT 0,
    budget_allocated INTEGER,
    
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: A/B Test Campaigns
CREATE TABLE ab_test_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brand_accounts(id) ON DELETE CASCADE NOT NULL,
    
    -- Test details
    test_name TEXT NOT NULL,
    product_id TEXT,
    variants JSONB NOT NULL, -- {variant_a: {...}, variant_b: {...}}
    
    -- Targeting
    target_venue_ids UUID[],
    sample_size INTEGER,
    
    -- Results
    results JSONB DEFAULT '{}',
    winner TEXT,
    confidence_level FLOAT,
    
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed')),
    
    start_date DATE,
    end_date DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Product Feedback
CREATE TABLE product_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Feedback
    product_id TEXT NOT NULL,
    brand_id UUID REFERENCES brand_accounts(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    feedback_text TEXT,
    
    -- AI Analysis
    sentiment_score FLOAT,
    themes JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
// 7.3: DYNAMIC AD-AUCTION SYSTEM
// ============================================

-- Table: Ad Auctions
CREATE TABLE ad_auctions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Trigger
    trigger_type TEXT NOT NULL, -- 'search', 'location', 'time', 'intent'
    trigger_query TEXT, -- Search query that triggered
    user_cluster_id INTEGER,
    
    -- Auction
    auction_start TIMESTAMPTZ NOT NULL,
    auction_duration_seconds INTEGER DEFAULT 60,
    
    -- Bids
    bids JSONB DEFAULT '[]', -- [{venue_id, amount, timestamp}]
    highest_bid INTEGER DEFAULT 0,
    winning_venue_id UUID REFERENCES venues(id),
    
    -- Result
    winner_selected_at TIMESTAMPTZ,
    is_completed BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Ad Impressions Log
CREATE TABLE ad_impressions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Auction
    auction_id UUID REFERENCES ad_auctions(id),
    venue_id UUID REFERENCES venues(id),
    
    -- User (encrypted for privacy)
    user_session_hash TEXT, -- Hashed session ID
    
    -- Metrics
    impression_count INTEGER DEFAULT 1,
    click_count INTEGER DEFAULT 0,
    conversion_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Intent Signals
CREATE TABLE intent_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_hash TEXT,
    
    -- Signal
    signal_type TEXT NOT NULL, -- 'search', 'browse', 'wishlist', 'bookmark'
    query_text TEXT,
    venue_category TEXT,
    location_lat FLOAT,
    location_lng FLOAT,
    
    intent_score FLOAT DEFAULT 0.5, -- 0-1 score
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
// 7.4: GOVERNMENT DASHBOARD
// ============================================

-- Table: Tourism Flow Data
CREATE TABLE tourism_flow_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Period
    date DATE NOT NULL,
    
    -- Location
    district TEXT NOT NULL,
    city_id UUID REFERENCES cities(id),
    
    -- Flow metrics
    domestic_visitors INTEGER DEFAULT 0,
    international_visitors INTEGER DEFAULT 0,
    total_night_stay_estimate INTEGER DEFAULT 0,
    
    -- Economic
    estimated_spending_idr BIGINT DEFAULT 0,
    estimated_tax_revenue BIGINT DEFAULT 0,
    
    -- Safety
    incident_reports INTEGER DEFAULT 0,
    safety_score FLOAT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(date, district)
);

-- Table: Government API Keys
CREATE TABLE government_api_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Organization
    organization_name TEXT NOT NULL,
    organization_type TEXT NOT NULL, -- 'city_gov', 'province_gov', 'tourism_board'
    
    -- Contact
    contact_email TEXT NOT NULL,
    contact_person TEXT,
    
    -- Access
    api_key TEXT UNIQUE NOT NULL,
    access_level TEXT DEFAULT 'basic', -- 'basic', 'full', 'realtime'
    rate_limit_per_day INTEGER DEFAULT 1000,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
// 7.5: FINANCIAL SCORE (CREDIT STUB)
// ============================================

-- Table: User Financial Profiles
CREATE TABLE financial_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    
    -- Score
    lifestyle_score INTEGER DEFAULT 500, -- 300-850 range
    score_tier TEXT DEFAULT 'standard', -- 'standard', 'gold', 'platinum'
    
    -- Traits (anonymized for privacy)
    total_spent_30d INTEGER DEFAULT 0,
    total_spent_90d INTEGER DEFAULT 0,
    avg_transaction INTEGER DEFAULT 0,
    visit_consistency_score FLOAT DEFAULT 0, -- 0-1
    
    -- Reliability
    no_show_count INTEGER DEFAULT 0,
    cancellation_count INTEGER DEFAULT 0,
    total_bookings INTEGER DEFAULT 0,
    
    -- BNPL eligibility
    bnpl_eligible BOOLEAN DEFAULT false,
    bnpl_limit INTEGER DEFAULT 0,
    current_bnpl_balance INTEGER DEFAULT 0,
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: BNPL Transactions
CREATE TABLE bnpl_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    booking_id UUID REFERENCES bookings(id),
    
    amount INTEGER NOT NULL,
    tenure_days INTEGER DEFAULT 30,
    
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paid', 'overdue', 'defaulted')),
    
    due_date DATE,
    paid_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
// 7.6: PRIVACY & COMPLIANCE
// ============================================

-- Table: Data Anonymization Log
CREATE TABLE anonymization_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    table_name TEXT NOT NULL,
    record_count INTEGER NOT NULL,
    fields_anonymized TEXT[],
    
    -- Method
    method TEXT NOT NULL, -- 'hash', 'mask', 'generalize', 'aggregate'
    
    -- Compliance
    legal_basis TEXT, -- 'consent', 'legitimate_interest'
    
    executed_by UUID REFERENCES auth.users(id),
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Consent Records
CREATE TABLE user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Consent type
    consent_type TEXT NOT NULL, -- 'marketing', 'analytics', 'personalization', 'data_sharing'
    
    -- Status
    is_given BOOLEAN DEFAULT false,
    given_at TIMESTAMPTZ,
    withdrawn_at TIMESTAMPTZ,
    
    -- Version
    policy_version TEXT,
    
    UNIQUE(user_id, consent_type)
);

-- ============================================
// FUNCTIONS
// ============================================

-- Function: Calculate lifestyle score
CREATE OR REPLACE FUNCTION calculate_lifestyle_score(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_score INTEGER := 500;
    v_visits INTEGER;
    v_spend NUMERIC;
    v_noshows INTEGER;
BEGIN
    -- Get metrics from last 90 days
    SELECT 
        COUNT(*),
        COALESCE(SUM(total_amount), 0),
        COALESCE(SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END), 0)
    INTO v_visits, v_spend, v_noshows
    FROM bookings
    WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '90 days';
    
    -- Spend component (0-200 points)
    IF v_spend > 50000000 THEN
        v_score := v_score + 200;
    ELSIF v_spend > 25000000 THEN
        v_score := v_score + 150;
    ELSIF v_spend > 10000000 THEN
        v_score := v_score + 100;
    ELSIF v_spend > 5000000 THEN
        v_score := v_score + 50;
    END IF;
    
    -- Consistency (0-150 points)
    IF v_visits > 20 THEN
        v_score := v_score + 150;
    ELSIF v_visits > 10 THEN
        v_score := v_score + 100;
    ELSIF v_visits > 5 THEN
        v_score := v_score + 50;
    END IF;
    
    -- Reliability (negative for no-shows)
    IF v_noshows > 5 THEN
        v_score := v_score - 100;
    ELSIF v_noshows > 2 THEN
        v_score := v_score - 50;
    END IF;
    
    -- Clamp
    v_score := GREATEST(300, LEAST(850, v_score));
    
    RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- Function: Anonymize user data
CREATE OR REPLACE FUNCTION anonymize_user_data(p_user_id UUID, p_method TEXT DEFAULT 'hash')
RETURNS VOID AS $$
BEGIN
    -- Hash personal identifiers
    UPDATE profiles SET
        phone = encode(gen_random_bytes(8), 'hex'),
        full_name = 'User_' || encode(gen_random_bytes(4), 'hex')
    WHERE id = p_user_id;
    
    -- Log anonymization
    INSERT INTO anonymization_log (table_name, record_count, fields_anonymized, method)
    VALUES ('profiles', 1, ARRAY['phone', 'full_name'], p_method);
END;
$$ LANGUAGE plpgsql;

-- Function: Trigger ad auction
CREATE OR REPLACE FUNCTION trigger_ad_auction(
    p_trigger_type TEXT,
    p_query TEXT,
    p_user_cluster INTEGER
)
RETURNS UUID AS $$
DECLARE
    v_auction_id UUID;
BEGIN
    INSERT INTO ad_auctions (trigger_type, trigger_query, user_cluster_id, auction_start)
    VALUES (p_trigger_type, p_query, p_user_cluster, NOW())
    RETURNING id INTO v_auction_id;
    
    RETURN v_auction_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
// RLS POLICIES
-- ============================================

ALTER TABLE consumption_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE peak_flow_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_share_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_promos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE intent_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tourism_flow_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE government_api_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bnpl_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymization_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

-- Brand accounts: Brand owner manage
CREATE POLICY "Brands manage own" ON brand_accounts FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- Market share: Brand owner view
CREATE POLICY "Brands view own share" ON market_share_data FOR ALL USING (
    brand_id IN (SELECT id FROM brand_accounts WHERE created_by = auth.uid())
);

-- Flash promos: Brand owner manage
CREATE POLICY "Brands manage promos" ON flash_promos FOR ALL USING (
    brand_id IN (SELECT id FROM brand_accounts WHERE created_by = auth.uid())
);

-- Financial profiles: User view own
CREATE POLICY "Users view own finance" ON financial_profiles FOR SELECT USING (
    user_id = auth.uid()
);

-- Tourism data: Public read (anonymized)
CREATE POLICY "Public read tourism" ON tourism_flow_data FOR SELECT USING (
    true
);

-- Government API: Admin manage
CREATE POLICY "Admin manage gov access" ON government_api_access FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);
