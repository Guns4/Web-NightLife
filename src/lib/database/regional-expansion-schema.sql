-- ============================================
-- PHASE 6: NATIONAL EXPANSION & REGIONAL INTELLIGENCE
-- Multi-Region Architecture, Localized Vibes, Tourism Module
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
// 1. MULTI-REGION ARCHITECTURE
-- ============================================

-- Table: Cities
-- Supported cities for the platform
CREATE TABLE cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- City details
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE, -- 'jakarta', 'bali', 'surabaya'
    country TEXT DEFAULT 'Indonesia',
    region TEXT, -- 'java', 'sumatra', 'kalimantan', 'sulawesi'
    
    -- Geolocation
    coordinates GEOGRAPHY(POINT, 4326),
    timezone TEXT DEFAULT 'Asia/Jakarta',
    
    -- Settings
    is_active BOOLEAN DEFAULT true,
    is_tourism_hub BOOLEAN DEFAULT false, -- High international tourist traffic
    
    -- Localized settings
    default_currency TEXT DEFAULT 'IDR',
    default_language TEXT DEFAULT 'id',
    entertainment_tax_rate FLOAT DEFAULT 0.10, -- Pajak Hiburan
    
    -- CDN settings
    cdn_region TEXT, -- 'ap-southeast-1', 'ap-southeast-3'
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cities_slug ON cities(slug);
CREATE INDEX idx_cities_active ON cities(is_active) WHERE is_active = true;

-- Table: City User Preferences
-- Per-city user preferences
CREATE TABLE city_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
    
    -- Preferences for this city
    preferred_venue_categories JSONB DEFAULT '[]',
    notifications_enabled BOOLEAN DEFAULT true,
    
    -- Stats in this city
    total_visits INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    
    UNIQUE(user_id, city_id)
);

CREATE INDEX idx_city_prefs_user ON city_preferences(user_id);
CREATE INDEX idx_city_prefs_city ON city_preferences(city_id);

-- ============================================
// 2. LOCALIZED VIBE CATEGORIES
-- ============================================

-- Table: City Vibe Categories
-- City-specific venue category priorities
CREATE TABLE city_vibe_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
    
    -- Category configuration
    category TEXT NOT NULL, -- 'beach_club', 'ktv', 'club', etc.
    
    -- Priority settings
    priority_rank INTEGER DEFAULT 10, -- 1 = highest priority in UI
    is_featured BOOLEAN DEFAULT false,
    
    -- Localized labels
    display_name TEXT,
    description TEXT,
    
    -- Trend settings
    trending_threshold INTEGER DEFAULT 50, -- visits/day to be "trending"
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_city_vibes_city ON city_vibe_categories(city_id);

-- Table: Local Trending Venues
-- Real-time trending by city
CREATE TABLE city_trending_venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
    
    -- Metrics
    visit_count_24h INTEGER DEFAULT 0,
    visit_count_7d INTEGER DEFAULT 0,
    revenue_24h INTEGER DEFAULT 0,
    buzz_score FLOAT DEFAULT 0.0, -- Social media mentions
    
    -- AI computed
    trending_score FLOAT DEFAULT 0.0,
    trend_direction TEXT DEFAULT 'stable', -- 'up', 'down', 'stable'
    
    -- Timestamps
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(city_id, venue_id)
);

CREATE INDEX idx_trending_city ON city_trending_venues(city_id, trending_score DESC);

-- ============================================
// 3. TOURISM & CURRENCY INTEGRATION
-- ============================================

-- Table: Currency Settings
-- Supported currencies
CREATE TABLE currencies (
    code TEXT PRIMARY KEY, -- 'IDR', 'USD', 'AUD', 'SGD'
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    exchange_rate_to_idr FLOAT NOT NULL,
    decimal_places INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- Table: User Currency Preferences
-- User's preferred display currency
CREATE TABLE user_currency_prefs (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    preferred_currency TEXT DEFAULT 'IDR',
    auto_detect BOOLEAN DEFAULT true, -- Auto-detect from location
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Translated Reviews
-- AI-translated vibe checks
CREATE TABLE translated_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_review_id UUID NOT NULL,
    original_language TEXT NOT NULL,
    
    -- Translation
    translated_text TEXT NOT NULL,
    translated_language TEXT NOT NULL,
    translation_confidence FLOAT DEFAULT 0.0,
    
    -- AI Translation service
    translation_model TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_translated_original ON translated_reviews(original_review_id);

-- Table: Tourism Venues
-- Venues specifically optimized for tourists
CREATE TABLE tourism_venue_settings (
    venue_id UUID PRIMARY KEY REFERENCES venues(id) ON DELETE CASCADE,
    
    -- Tourism features
    accepts_international_cards BOOLEAN DEFAULT false,
    has_english_staff BOOLEAN DEFAULT false,
    has_multilingual_menu BOOLEAN DEFAULT false,
    
    -- International payment methods
    accepts_visa BOOLEAN DEFAULT false,
    accepts_mastercard BOOLEAN DEFAULT false,
    accepts_stripe BOOLEAN DEFAULT false,
    
    -- Tourism description
    english_description TEXT,
    chinese_description TEXT,
    japanese_description TEXT,
    
    -- Timestamps
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
// 4. REGIONAL CITY MAYOR LEADERBOARD
-- ============================================

-- Table: City Leaderboard Entries
-- Weekly/monthly rankings per city
CREATE TABLE city_leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Time period
    period_type TEXT NOT NULL, -- 'weekly', 'monthly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Ranking
    rank INTEGER NOT NULL,
    previous_rank INTEGER,
    
    -- Metrics
    visit_count INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    friends_invited INTEGER DEFAULT 0,
    
    -- Rewards
    reward_tier TEXT, -- 'king', 'queen', 'prince', 'regular'
    reward_perks JSONB DEFAULT '[]',
    
    UNIQUE(city_id, user_id, period_type, period_start)
);

CREATE INDEX idx_leaderboard_city ON city_leaderboard(city_id, period_type, period_start DESC, rank);

-- Table: City Rewards
-- Per-city reward configurations
CREATE TABLE city_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
    
    -- Reward details
    reward_name TEXT NOT NULL,
    reward_description TEXT,
    rank_required INTEGER NOT NULL, -- 1 for King, 2-3 for Queen, etc.
    
    -- Reward value
    discount_percentage INTEGER,
    free_entry_count INTEGER,
    vip_access_level INTEGER,
    
    -- Validity
    valid_from DATE,
    valid_until DATE,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
// 5. REGIONAL OWNER AD-NETWORK
-- ============================================

-- Table: Regional Ad Campaigns
-- City-specific ad bidding
CREATE TABLE regional_ad_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Targeting
    target_cities UUID[] DEFAULT '{}', -- Cities to target
    exclude_cities UUID[] DEFAULT '{}',
    
    -- Travel pattern targeting
    target_traveling_users BOOLEAN DEFAULT false, -- Users in other cities looking at this city
    travel_holiday_only BOOLEAN DEFAULT false,
    
    -- Budget
    daily_budget INTEGER NOT NULL,
    total_budget INTEGER,
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
    
    -- Performance
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ
);

CREATE INDEX idx_regional_ads_target ON regional_ad_campaigns(target_cities);
CREATE INDEX idx_regional_ads_status ON regional_ad_campaigns(status);

-- Table: Travel Pattern Detection
-- Detect users traveling to other cities
CREATE TABLE travel_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Pattern
    home_city_id UUID REFERENCES cities(id),
    detected_city_id UUID REFERENCES cities(id),
    
    -- Detection
    detection_type TEXT NOT NULL, -- 'search', 'booking', 'geolocation'
    confidence_score FLOAT DEFAULT 0.0,
    
    -- Timing
    travel_date DATE,
    is_holiday BOOLEAN DEFAULT false,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_travel_user ON travel_patterns(user_id, is_active) WHERE is_active = true;

-- ============================================
// 6. REGIONAL TAX & SEO SETTINGS
-- ============================================

-- Table: Regional Tax Configurations
-- Entertainment tax by city/region
CREATE TABLE regional_tax_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
    
    -- Tax rates
    entertainment_tax_rate FLOAT DEFAULT 0.10,
    service_charge_rate FLOAT DEFAULT 0.10,
    
    -- Tax brackets for venue types
    venue_type_rates JSONB DEFAULT '{}', -- { "club": 0.15, "ktv": 0.10 }
    
    -- Effective dates
    effective_from DATE NOT NULL,
    effective_until DATE,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: SEO Meta Tags
-- Dynamic SEO for each city
CREATE TABLE city_seo_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
    
    -- Meta tags
    meta_title TEXT NOT NULL, -- "Best Nightclub in Bali 2026"
    meta_description TEXT,
    meta_keywords TEXT[],
    
    -- OG Tags
    og_title TEXT,
    og_description TEXT,
    og_image_url TEXT,
    
    -- Local SEO
    google_business_name TEXT,
    google_business_id TEXT,
    
    -- Schema
    schema_markup JSONB DEFAULT '{}',
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
// FUNCTIONS
-- ============================================

-- Function: Auto-detect user city by geolocation
CREATE OR REPLACE FUNCTION detect_user_city(
    user_lat FLOAT,
    user_lng FLOAT
)
RETURNS TABLE (city_id UUID, city_name TEXT, distance_km FLOAT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        ST_Distance(
            c.coordinates::geography,
            ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
        ) / 1000 AS distance_km
    FROM cities c
    WHERE c.is_active = true
    ORDER BY distance_km ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate trending score
CREATE OR REPLACE FUNCTION calculate_trending_score(
    p_city_id UUID,
    p_venue_id UUID
)
RETURNS FLOAT AS $$
DECLARE
    v_visits_24h INTEGER;
    v_visits_7d INTEGER;
    v_buzz_score FLOAT;
    v_score FLOAT;
BEGIN
    -- Get visit counts
    SELECT COALESCE(visit_count_24h, 0), COALESCE(visit_count_7d, 0), COALESCE(buzz_score, 0)
    INTO v_visits_24h, v_visits_7d, v_buzz_score
    FROM city_trending_venues
    WHERE city_id = p_city_id AND venue_id = p_venue_id;
    
    -- Calculate trending score (weighted)
    v_score := (
        (v_visits_24h * 2.0) +  -- Recent activity weighted higher
        (v_visits_7d * 0.5) +     -- Week activity
        (v_buzz_score * 10.0)     -- Social buzz
    );
    
    RETURN COALESCE(v_score, 0);
END;
$$ LANGUAGE plpgsql;

-- Function: Update city leaderboard
CREATE OR REPLACE FUNCTION update_city_leaderboard(
    p_city_id UUID,
    p_period_type TEXT DEFAULT 'weekly'
)
RETURNS VOID AS $$
DECLARE
    v_start DATE;
    v_end DATE;
    v_record RECORD;
    v_rank INTEGER := 1;
BEGIN
    -- Determine period
    IF p_period_type = 'weekly' THEN
        v_start := DATE_TRUNC('week', CURRENT_DATE)::DATE;
        v_end := v_start + INTERVAL '6 days';
    ELSE
        v_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
        v_end := v_start + INTERVAL '1 month' - INTERVAL '1 day';
    END IF;
    
    -- Get top users by XP in period
    FOR v_record IN
        SELECT 
            c.user_id,
            SUM(c.xp_awarded) as total_xp,
            COUNT(*) as visit_count,
            SUM(c.total_spent) as total_spent
        FROM checkins c
        JOIN venues v ON v.id = c.venue_id
        WHERE v.city_id = p_city_id
          AND c.timestamp BETWEEN v_start AND v_end
        GROUP BY c.user_id
        ORDER BY total_xp DESC
        LIMIT 100
    LOOP
        -- Insert/update leaderboard
        INSERT INTO city_leaderboard (
            city_id, user_id, period_type, period_start, period_end,
            rank, visit_count, total_spent, xp_earned
        ) VALUES (
            p_city_id, v_record.user_id, p_period_type, v_start, v_end,
            v_rank, v_record.visit_count, v_record.total_spent, v_record.total_xp
        )
        ON CONFLICT (city_id, user_id, period_type, period_start)
        DO UPDATE SET
            rank = v_rank,
            visit_count = v_record.visit_count,
            total_spent = v_record.total_spent,
            xp_earned = v_record.total_xp;
        
        v_rank := v_rank + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function: Get localized venue categories
CREATE OR REPLACE FUNCTION get_city_venue_categories(
    p_city_id UUID
)
RETURNS TABLE (
    category TEXT,
    display_name TEXT,
    priority_rank INTEGER,
    is_featured BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cvc.category,
        COALESCE(cvc.display_name, cvc.category)::TEXT,
        cvc.priority_rank,
        cvc.is_featured
    FROM city_vibe_categories cvc
    WHERE cvc.city_id = p_city_id
    ORDER BY cvc.priority_rank ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
// RLS POLICIES
-- ============================================

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_vibe_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_trending_venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_currency_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE translated_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE tourism_venue_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE regional_ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE regional_tax_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_seo_settings ENABLE ROW LEVEL SECURITY;

-- Cities: Public read
CREATE POLICY "Anyone read cities" ON cities FOR SELECT USING (is_active = true);

-- City preferences: Users manage own
CREATE POLICY "Users manage own city prefs" ON city_preferences FOR ALL USING (user_id = auth.uid());

-- Trending: Public read
CREATE POLICY "Anyone read trending" ON city_trending_venues FOR SELECT USING (true);

-- Currencies: Public read
CREATE POLICY "Anyone read currencies" ON currencies FOR SELECT USING (is_active = true);

-- User currency: Users manage own
CREATE POLICY "Users manage own currency" ON user_currency_prefs FOR ALL USING (user_id = auth.uid());

-- Translated reviews: Public read
CREATE POLICY "Anyone read translations" ON translated_reviews FOR SELECT USING (true);

-- Leaderboard: Public read
CREATE POLICY "Anyone read leaderboard" ON city_leaderboard FOR SELECT USING (true);

-- Regional ads: Owners manage own
CREATE POLICY "Owners manage own regional ads" ON regional_ad_campaigns FOR ALL USING (owner_id = auth.uid());

-- Travel patterns: Users view own
CREATE POLICY "Users view own travel" ON travel_patterns FOR SELECT USING (user_id = auth.uid());

-- Tax config: Public read
CREATE POLICY "Anyone read tax config" ON regional_tax_config FOR SELECT USING (is_active = true);

-- SEO settings: Public read
CREATE POLICY "Anyone read SEO" ON city_seo_settings FOR SELECT USING (true);

-- ============================================
-- SEED DATA
-- ============================================

-- Seed cities
INSERT INTO cities (name, slug, region, timezone, entertainment_tax_rate, is_tourism_hub, cdn_region) VALUES
    ('Jakarta', 'jakarta', 'java', 'Asia/Jakarta', 0.10, false, 'ap-southeast-1'),
    ('Bali', 'bali', 'nusantara', 'Asia/Makassar', 0.08, true, 'ap-southeast-3'),
    ('Surabaya', 'surabaya', 'java', 'Asia/Jakarta', 0.10, false, 'ap-southeast-1'),
    ('Bandung', 'bandung', 'java', 'Asia/Jakarta', 0.10, false, 'ap-southeast-1'),
    ('Medan', 'medan', 'sumatra', 'Asia/Jakarta', 0.12, false, 'ap-southeast-1')
ON CONFLICT (slug) DO NOTHING;

-- Seed currencies
INSERT INTO currencies (code, name, symbol, exchange_rate_to_idr, decimal_places) VALUES
    ('IDR', 'Indonesian Rupiah', 'Rp', 1, 0),
    ('USD', 'US Dollar', '$', 15800, 2),
    ('AUD', 'Australian Dollar', 'A$', 10500, 2),
    ('SGD', 'Singapore Dollar', 'S$', 11800, 2)
ON CONFLICT (code) DO NOTHING;

-- Seed city vibe categories for Jakarta
INSERT INTO city_vibe_categories (city_id, category, priority_rank, is_featured, display_name)
SELECT 
    c.id,
    'club', 1, true, 'Premium Clubs'
FROM cities c WHERE c.slug = 'jakarta'
ON CONFLICT DO NOTHING;

INSERT INTO city_vibe_categories (city_id, category, priority_rank, is_featured, display_name)
SELECT 
    c.id,
    'ktv', 2, true, 'Executive KTV'
FROM cities c WHERE c.slug = 'jakarta'
ON CONFLICT DO NOTHING;

-- Seed city vibe categories for Bali
INSERT INTO city_vibe_categories (city_id, category, priority_rank, is_featured, display_name)
SELECT 
    c.id,
    'beach_club', 1, true, 'Beach Clubs'
FROM cities c WHERE c.slug = 'bali'
ON CONFLICT DO NOTHING;

INSERT INTO city_vibe_categories (city_id, category, priority_rank, is_featured, display_name)
SELECT 
    c.id,
    'lounge', 2, true, 'Sunset Lounges'
FROM cities c WHERE c.slug = 'bali'
ON CONFLICT DO NOTHING;
