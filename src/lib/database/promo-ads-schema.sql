-- =====================================================
-- MERCHANT SELF-SERVICE DASHBOARD SCHEMA
-- Promos & Ads Management
-- =====================================================

-- 1. Add boosting columns to venues table
ALTER TABLE venues ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN DEFAULT false;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS boost_expiry TIMESTAMPTZ;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS boost_slot VARCHAR(50); -- 'homepage_banner', 'top_search', 'featured', null

-- 2. Add poster and target category to promos
ALTER TABLE promos ADD COLUMN IF NOT EXISTS poster_url TEXT;
ALTER TABLE promos ADD COLUMN IF NOT EXISTS target_category VARCHAR(50); -- 'all', 'vip', 'regular', 'students', 'couples'

-- 3. Create ads_orders table for tracking premium ad purchases
CREATE TABLE IF NOT EXISTS ads_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES profiles(id),
    
    -- Ad details
    ad_type VARCHAR(50) NOT NULL, -- 'homepage_banner', 'top_search', 'featured_card'
    duration_days INT NOT NULL,
    price_amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'IDR',
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'active', 'expired', 'cancelled'
    
    -- Timing
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0
);

-- 4. Create promo_performance table for tracking
CREATE TABLE IF NOT EXISTS promo_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promo_id UUID NOT NULL REFERENCES promos(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES venues(id),
    
    -- Metrics
    views INT DEFAULT 0,
    redemptions INT DEFAULT 0,
    
    -- Date
    recorded_at DATE DEFAULT CURRENT_DATE
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_venues_boosted ON venues(is_boosted, boost_expiry) WHERE is_boosted = true;
CREATE INDEX IF NOT EXISTS idx_ads_orders_venue ON ads_orders(venue_id);
CREATE INDEX IF NOT EXISTS idx_ads_orders_status ON ads_orders(status);
CREATE INDEX IF NOT EXISTS idx_promos_active ON promos(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promo_performance_promo ON promo_performance(promo_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE ads_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_performance ENABLE ROW LEVEL SECURITY;

-- Ads orders - owner can manage their own
CREATE POLICY "Owners manage own ads" ON ads_orders FOR ALL
  USING (owner_id = auth.uid());

-- Promo performance - owners can view their own
CREATE POLICY "Owners view own promo performance" ON promo_performance FOR ALL
  USING (
    venue_id IN (SELECT id FROM venues WHERE owner_id = auth.uid())
  );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to activate boost on venue
CREATE OR REPLACE FUNCTION activate_venue_boost(
    p_venue_id UUID,
    p_ad_type VARCHAR(50),
    p_duration_days INT,
    p_price_amount NUMERIC
)
RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_starts_at TIMESTAMPTZ;
    v_ends_at TIMESTAMPTZ;
BEGIN
    v_starts_at := NOW();
    v_ends_at := NOW() + (p_duration_days || ' days')::INTERVAL;
    
    -- Create ads order
    INSERT INTO ads_orders (
        venue_id,
        owner_id,
        ad_type,
        duration_days,
        price_amount,
        status,
        starts_at,
        ends_at
    )
    SELECT 
        p_venue_id,
        owner_id,
        p_ad_type,
        p_duration_days,
        p_price_amount,
        'active',
        v_starts_at,
        v_ends_at
    FROM venues WHERE id = p_venue_id
    RETURNING id INTO v_order_id;
    
    -- Update venue with boost
    UPDATE venues
    SET is_boosted = true,
        boost_expiry = v_ends_at,
        boost_slot = p_ad_type,
        updated_at = NOW()
    WHERE id = p_venue_id;
    
    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

-- Function to deactivate expired boosts (for cron)
CREATE OR REPLACE FUNCTION deactivate_expired_boosts()
RETURNS void AS $$
BEGIN
    -- Deactivate expired boosts
    UPDATE venues
    SET is_boosted = false,
        boost_slot = NULL,
        boost_expiry = NULL
    WHERE is_boosted = true AND boost_expiry < NOW();
    
    -- Update ads orders status
    UPDATE ads_orders
    SET status = 'expired'
    WHERE status = 'active' AND ends_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get active promos (scheduled publishing)
CREATE OR REPLACE FUNCTION get_active_promos()
RETURNS SETOF promos AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM promos
    WHERE is_active = true
      AND start_date <= NOW()
      AND end_date >= NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to calculate promo reach estimate
CREATE OR REPLACE FUNCTION estimate_promo_reach(p_venue_id UUID)
RETURNS INT AS $
DECLARE
    v_weekly_views INT;
BEGIN
    -- Get average weekly views for the venue
    -- This is a simplified version - in production, you'd have analytics data
    SELECT COALESCE(
        (SELECT AVG(views)::INT FROM promo_performance 
         WHERE venue_id = p_venue_id 
         AND recorded_at >= NOW() - INTERVAL '7 days'),
        100  -- Default fallback
    ) INTO v_weekly_views;
    
    RETURN v_weekly_views;
END;
$ LANGUAGE plpgsql;

-- =====================================================
-- DATABASE TRIGGERS
-- =====================================================

-- Trigger 1: Trust Score Updater
-- When a review with is_verified_visit = true is inserted, recalculate trust_score
CREATE OR REPLACE FUNCTION update_venue_trust_score()
RETURNS TRIGGER AS $
DECLARE
    v_venue_id UUID;
    v_new_trust_score FLOAT;
    v_verified_count INT;
    v_total_reviews INT;
BEGIN
    -- Determine the venue_id based on insert or update
    IF TG_OP = 'INSERT' THEN
        v_venue_id := NEW.venue_id;
    ELSE
        v_venue_id := OLD.venue_id;
    END IF;
    
    -- Only recalculate if is_verified_visit is true
    IF TG_OP = 'INSERT' AND NEW.is_verified_visit = true THEN
        -- Count verified visits and total reviews
        SELECT 
            COUNT(*) FILTER (WHERE is_verified_visit = true) INTO v_verified_count,
            COUNT(*) INTO v_total_reviews
        FROM reviews
        WHERE venue_id = v_venue_id;
        
        -- Calculate trust score: (verified / total) * 100
        IF v_total_reviews > 0 THEN
            v_new_trust_score := (v_verified_count::FLOAT / v_total_reviews::FLOAT) * 100;
        ELSE
            v_new_trust_score := 0;
        END IF;
        
        -- Update venue trust_score
        UPDATE venues
        SET trust_score = v_new_trust_score,
            updated_at = NOW()
        WHERE id = v_venue_id;
    END IF;
    
    IF TG_OP = 'UPDATE' AND NEW.is_verified_visit != OLD.is_verified_visit AND NEW.is_verified_visit = true THEN
        SELECT 
            COUNT(*) FILTER (WHERE is_verified_visit = true) INTO v_verified_count,
            COUNT(*) INTO v_total_reviews
        FROM reviews
        WHERE venue_id = v_venue_id;
        
        IF v_total_reviews > 0 THEN
            v_new_trust_score := (v_verified_count::FLOAT / v_total_reviews::FLOAT) * 100;
        ELSE
            v_new_trust_score := 0;
        END IF;
        
        UPDATE venues
        SET trust_score = v_new_trust_score,
            updated_at = NOW()
        WHERE id = v_venue_id;
    END IF;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Create trigger for trust score updates
DROP TRIGGER IF EXISTS trigger_update_trust_score ON reviews;
CREATE TRIGGER trigger_update_trust_score
    AFTER INSERT OR UPDATE OF is_verified_visit
    ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_venue_trust_score();

-- Trigger 2: Boost Activation Logger
-- Log boost purchases to analytics_finance
CREATE OR REPLACE FUNCTION log_boost_transaction()
RETURNS TRIGGER AS $
DECLARE
    v_analytics_id UUID;
BEGIN
    -- Only log when boost is activated
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        -- Check if analytics_finance table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'analytics_finance') THEN
            INSERT INTO analytics_finance (
                venue_id,
                metric_type,
                amount,
                currency,
                metadata,
                recorded_at
            )
            VALUES (
                NEW.venue_id,
                'ad_revenue',
                NEW.price_amount,
                NEW.currency,
                jsonb_build_object(
                    'order_id', NEW.id,
                    'ad_type', NEW.ad_type,
                    'duration_days', NEW.duration_days,
                    'boost_slot', NEW.ad_type
                ),
                NOW()
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Create trigger for boost logging
DROP TRIGGER IF EXISTS trigger_log_boost_transaction ON ads_orders;
CREATE TRIGGER trigger_log_boost_transaction
    AFTER INSERT
    ON ads_orders
    FOR EACH ROW
    EXECUTE FUNCTION log_boost_transaction();

-- Add trust_score column if not exists
ALTER TABLE venues ADD COLUMN IF NOT EXISTS trust_score FLOAT DEFAULT 0;

-- Add is_verified_visit to reviews if not exists  
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_verified_visit BOOLEAN DEFAULT false;
