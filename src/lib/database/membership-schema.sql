-- =====================================================
-- NIGHTPASS MEMBERSHIP SYSTEM
-- AfterHoursID - Digital Subscription & Billing
-- =====================================================

-- Membership Plans
CREATE TABLE IF NOT EXISTS membership_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    tier VARCHAR(20) NOT NULL, -- 'silver', 'gold', 'platinum', 'vip'
    description TEXT,
    price_monthly INTEGER NOT NULL, -- In IDR cents
    price_yearly INTEGER,
    benefits JSONB NOT NULL DEFAULT '{}',
    features JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Memberships
CREATE TABLE IF NOT EXISTS user_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES membership_plans(id),
    tier VARCHAR(20) NOT NULL DEFAULT 'silver',
    status VARCHAR(20) NOT NULL DEFAULT 'inactive', -- 'inactive', 'active', 'cancelled', 'expired', 'frozen'
    
    -- Subscription details
    subscription_id VARCHAR(255), -- Midtrans/Xendit subscription ID
    payment_method VARCHAR(50), -- 'midtrans', 'xendit', 'wallet'
    external_subscription_status VARCHAR(50), -- 'active', 'past_due', 'cancelled'
    
    -- Timing
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    renewal_date TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Benefits tracking
    benefits JSONB NOT NULL DEFAULT '{}',
    benefits_used JSONB NOT NULL DEFAULT '{}',
    benefits_reset_at TIMESTAMP WITH TIME ZONE, -- Monthly reset date
    
    -- QR Code for verification
    qr_secret VARCHAR(255), -- TOTP secret
    qr_generated_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);
    
    -- Subscription details
    subscription_id VARCHAR(255), -- Midtrans/Xendit subscription ID
    payment_method VARCHAR(50), -- 'midtrans', 'xendit', 'wallet'
    external_subscription_status VARCHAR(50), -- 'active', 'past_due', 'cancelled'
    
    -- Timing
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    renewal_date TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Benefits tracking
    benefits JSONB NOT NULL DEFAULT '{
        "free_entry": 0,
        "free_drinks": 0,
        "skip_line": false,
        "vip_access": false,
        "guest_list": 0,
        "discount_percentage": 0
    }',
    benefits_used JSONB NOT NULL DEFAULT '{}',
    benefits_reset_at TIMESTAMP WITH TIME ZONE, -- Monthly reset date
    
    -- QR Code for verification
    qr_secret VARCHAR(255), -- TOTP secret
    qr_generated_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Benefit Redemptions (for tracking & payout)
CREATE TABLE IF NOT EXISTS benefit_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_membership_id UUID NOT NULL REFERENCES user_memberships(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    benefit_type VARCHAR(50) NOT NULL, -- 'free_entry', 'free_drinks', 'guest_list'
    benefit_value INTEGER NOT NULL,
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Settlement tracking
    partner_payout_amount INTEGER, -- In IDR cents
    partner_paid BOOLEAN NOT NULL DEFAULT FALSE,
    settled_at TIMESTAMP WITH TIME ZONE,
    settlement_batch_id VARCHAR(255)
);

-- Partner Payout Records
CREATE TABLE IF NOT EXISTS partner_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    venue_id UUID REFERENCES venues(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Calculations
    total_redemptions INTEGER NOT NULL DEFAULT 0,
    total_payout_amount INTEGER NOT NULL, -- In IDR cents
    platform_fee_percentage INTEGER NOT NULL DEFAULT 10,
    platform_fee_amount INTEGER NOT NULL,
    net_payout_amount INTEGER NOT NULL,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'processing', 'paid', 'failed')
    ),
    payment_reference VARCHAR(255),
    paid_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VIP Access Logs (Partner Scanner)
CREATE TABLE IF NOT EXISTS vip_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_membership_id UUID NOT NULL REFERENCES user_memberships(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    scanned_by UUID NOT NULL, -- Staff who scanned
    scan_result VARCHAR(50) NOT NULL, -- 'granted', 'denied', 'expired', 'invalid'
    denial_reason VARCHAR(255),
    location_point GEOGRAPHY(POINT, 4326), -- GPS location of scan
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Membership Analytics (for Churn Dashboard)
CREATE TABLE IF NOT EXISTS membership_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    
    -- Counts
    total_members INTEGER NOT NULL DEFAULT 0,
    active_members INTEGER NOT NULL DEFAULT 0,
    new_members INTEGER NOT NULL DEFAULT 0,
    cancelled_members INTEGER NOT NULL DEFAULT 0,
    churned_members INTEGER NOT NULL DEFAULT 0,
    
    -- Revenue
    mrr INTEGER NOT NULL DEFAULT 0, -- Monthly Recurring Revenue
    arr INTEGER NOT NULL DEFAULT 0, -- Annual Recurring Revenue
    
    -- Metrics
    churn_rate DECIMAL(5,4) NOT NULL DEFAULT 0,
    ltv DECIMAL(10,2) NOT NULL DEFAULT 0, -- Lifetime Value
    
    -- Tier breakdown
    tier_breakdown JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_memberships_user ON user_memberships(user_id);
CREATE INDEX idx_user_memberships_status ON user_memberships(status);
CREATE INDEX idx_user_memberships_tier ON user_memberships(tier);
CREATE INDEX idx_benefit_redemptions_membership ON benefit_redemptions(user_membership_id, redeemed_at);
CREATE INDEX idx_benefit_redemptions_venue ON benefit_redemptions(venue_id, redeemed_at);
CREATE INDEX idx_partner_payouts_partner ON partner_payouts(partner_id, period_start);
CREATE INDEX idx_vip_access_logs_venue ON vip_access_logs(venue_id, scanned_at);
CREATE INDEX idx_membership_analytics_date ON membership_analytics(date);

-- Default Plans Insert
INSERT INTO membership_plans (name, tier, description, price_monthly, price_yearly, benefits, features, sort_order) VALUES
('Silver NightPass', 'silver', 'Entry-level membership with exclusive benefits', 299000, 2990000, 
 '{"free_entry": 2, "free_drinks": 1, "skip_line": true, "vip_access": false, "guest_list": 0, "discount_percentage": 10}',
 '["Priority Entry", "2 Free Club Entries", "1 Free Drink", "10% Venue Discount"]',
 1),
('Gold NightPass', 'gold', 'Premium membership with VIP access', 599000, 5990000,
 '{"free_entry": 5, "free_drinks": 3, "skip_line": true, "vip_access": true, "guest_list": 2, "discount_percentage": 20}',
 '["VIP Entry", "5 Free Club Entries", "3 Free Drinks", "2 Guest List Spots", "20% Venue Discount", "Exclusive Events"]',
 2),
('Platinum NightPass', 'platinum', 'Ultimate nightlife experience', 999000, 9990000,
 '{"free_entry": 999, "free_drinks": 999, "skip_line": true, "vip_access": true, "guest_list": 999, "discount_percentage": 30}',
 '["Unlimited VIP Entry", "Unlimited Free Drinks", "Unlimited Guest List", "30% Venue Discount", "Private Events Access", "Personal Concierge"]',
 3);
