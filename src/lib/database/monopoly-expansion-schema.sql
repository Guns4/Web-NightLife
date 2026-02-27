-- ============================================
-- PHASE 6.1-6.10: THE INDONESIAN NIGHTLIFE MONOPOLY
-- Regional Expansion, Legal Compliance, Advanced Features
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
// 6.1: REGIONAL TAX & LEGAL COMPLIANCE (PB1 SYSTEM)
// ============================================

-- Table: Tax Configurations
CREATE TABLE tax_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
    
    -- Tax type
    tax_type TEXT NOT NULL, -- 'pb1', 'entertainment', 'service', 'vat'
    
    -- Rates
    tax_rate FLOAT NOT NULL,
    is_inclusive BOOLEAN DEFAULT false, -- Tax-inclusive pricing
    
    -- City-specific overrides
    city_tax_override JSONB DEFAULT '{}',
    
    is_active BOOLEAN DEFAULT true,
    effective_from DATE NOT NULL,
    effective_until DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Invoice Tax Details
CREATE TABLE invoice_tax_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
    
    -- Tax breakdown
    tax_type TEXT NOT NULL,
    taxable_amount INTEGER NOT NULL,
    tax_amount INTEGER NOT NULL,
    tax_rate FLOAT NOT NULL,
    
    -- City info
    city_id UUID REFERENCES cities(id),
    venue_id UUID REFERENCES venues(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
// 6.2: TOURISM GATEWAY (BALI-SPECIFIC)
// ============================================

-- Table: International Payment Methods
CREATE TABLE international_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    method_name TEXT NOT NULL, -- 'paypal', 'stripe', 'wechat', 'alipay'
    method_code TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    
    -- Integration
    api_key_hash TEXT,
    webhook_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Tourist Badges
CREATE TABLE tourist_venue_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
    
    badge_type TEXT NOT NULL, -- 'tourist_safe', 'multilingual', 'international_payment'
    badge_name TEXT NOT NULL,
    badge_description TEXT,
    
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: AI Translation Cache
CREATE TABLE ai_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Source
    source_type TEXT NOT NULL, -- 'review', 'menu', 'description'
    source_id UUID NOT NULL,
    source_language TEXT NOT NULL DEFAULT 'id',
    
    -- Target
    target_language TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    
    -- AI
    ai_model TEXT,
    confidence_score FLOAT DEFAULT 0.0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(source_type, source_id, target_language)
);

-- ============================================
// 6.3: THE "GUEST LIST" REVOLUTION
-- ============================================

-- Table: Guest Lists
CREATE TABLE guest_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
    
    -- Event details
    event_name TEXT NOT NULL,
    event_date DATE NOT NULL,
    
    -- Guest list
    total_slots INTEGER DEFAULT 100,
    confirmed_guests INTEGER DEFAULT 0,
    waitlist_count INTEGER DEFAULT 0,
    
    -- Ladies night settings
    is_ladies_night BOOLEAN DEFAULT false,
    ladies_entry_cutoff TIME DEFAULT '23:00:00',
    ladies_discount_percentage INTEGER DEFAULT 100,
    
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Guest List Entries
CREATE TABLE guest_list_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_list_id UUID REFERENCES guest_lists(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Guest info (non-member)
    guest_name TEXT,
    guest_phone TEXT,
    guest_email TEXT,
    
    -- Status
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'checked_in', 'cancelled', 'no_show')),
    
    -- Priority
    is_vip BOOLEAN DEFAULT false,
    is_influencer BOOLEAN DEFAULT false,
    referral_source TEXT,
    
    -- Check-in
    checked_in_at TIMESTAMPTZ,
    qr_code TEXT UNIQUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_guestlist_entries ON guest_list_entries(guest_list_id, status);

-- ============================================
// 6.4: SYNDICATE PARTNERSHIP NETWORK
-- ============================================

-- Table: Venue Groups
CREATE TABLE venue_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_name TEXT NOT NULL,
    group_type TEXT NOT NULL, -- 'chain', 'franchise', 'partnership'
    
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Cross-rewards
    cross_reward_enabled BOOLEAN DEFAULT true,
    cross_discount_percentage INTEGER DEFAULT 10,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Group Member Venues
CREATE TABLE venue_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES venue_groups(id) ON DELETE CASCADE NOT NULL,
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
    
    brand_order INTEGER DEFAULT 0,
    
    UNIQUE(group_id, venue_id)
);

-- Table: Cross-Venue Rewards
CREATE TABLE cross_venue_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES venue_groups(id) ON DELETE CASCADE NOT NULL,
    
    from_venue_id UUID REFERENCES venues(id) NOT NULL,
    to_venue_id UUID REFERENCES venues(id) NOT NULL,
    
    discount_percentage INTEGER DEFAULT 10,
    valid_days INT[] DEFAULT '{1,2,3,4,5,6,7}',
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
// 6.5: INFLUENCER & KOL PORTAL
-- ============================================

-- Table: Influencer Profiles
CREATE TABLE influencer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Social media
    instagram_handle TEXT,
    tiktok_handle TEXT,
    youtube_channel TEXT,
    follower_count INTEGER DEFAULT 0,
    
    -- Status
    is_verified BOOLEAN DEFAULT false,
    verification_level TEXT DEFAULT 'basic', -- 'basic', 'silver', 'gold', 'platinum'
    
    -- Commission
    commission_rate FLOAT DEFAULT 0.05,
    total_earnings INTEGER DEFAULT 0,
    pending_payout INTEGER DEFAULT 0,
    
    -- Metrics
    total_conversions INTEGER DEFAULT 0,
    total_reach INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Influencer Campaigns
CREATE TABLE influencer_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
    
    campaign_name TEXT NOT NULL,
    campaign_description TEXT,
    
    -- Budget
    total_budget INTEGER,
    commission_per_booking INTEGER DEFAULT 50000,
    
    -- Tracking
    target_bookings INTEGER,
    current_bookings INTEGER DEFAULT 0,
    
    -- Content requirements
    required_platforms TEXT[], -- ['instagram', 'tiktok']
    content_hashtags TEXT[],
    
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    
    start_date DATE,
    end_date DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Influencer Conversions
CREATE TABLE influencer_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    influencer_id UUID REFERENCES influencer_profiles(id) ON DELETE CASCADE NOT NULL,
    campaign_id UUID REFERENCES influencer_campaigns(id) ON DELETE SET NULL,
    
    booking_id UUID REFERENCES bookings(id),
    user_id UUID REFERENCES auth.users(id),
    
    platform TEXT NOT NULL, -- 'instagram', 'tiktok', 'youtube'
    content_url TEXT,
    
    commission_amount INTEGER DEFAULT 0,
    is_paid BOOLEAN DEFAULT false,
    
    converted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
// 6.6: LOGISTICS & SAFETY (HOME SAFE PROJECT)
// ============================================

-- Table: Transport Integrations
CREATE TABLE transport_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    provider TEXT NOT NULL, -- 'grab', 'gojek'
    is_active BOOLEAN DEFAULT true,
    
    api_endpoint TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Emergency Contacts
CREATE TABLE emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    relationship TEXT NOT NULL,
    
    is_primary BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: SOS Events
CREATE TABLE sos_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
    
    -- Location
    latitude FLOAT,
    longitude FLOAT,
    
    -- Type
    sos_type TEXT NOT NULL, -- 'medical', 'safety', 'harassment', 'emergency'
    description TEXT,
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'cancelled')),
    
    -- Response
    responded_by UUID REFERENCES auth.users(id),
    response_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- ============================================
// 6.7: ADVANCED BOTTLE SERVICE
// ============================================

-- Table: Bottle Lockers
CREATE TABLE bottle_lockers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Bottle details
    bottle_name TEXT NOT NULL,
    brand TEXT,
    volume_ml INTEGER,
    purchase_date DATE NOT NULL,
    
    -- Storage
    locker_number TEXT,
    remaining_ml INTEGER,
    expiry_date DATE,
    
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'finished', 'expired')),
    
    notified_expiry BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
// 6.8: EVENT & FESTIVAL ENGINE
-- ============================================

-- Table: Major Events
CREATE TABLE major_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
    
    event_name TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'festival', 'concert', 'party', 'popup'
    
    -- Schedule
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    
    -- Location
    location_name TEXT,
    latitude FLOAT,
    longitude FLOAT,
    is_outdoor BOOLEAN DEFAULT false,
    
    -- Ticketing
    total_tickets INTEGER NOT NULL,
    sold_tickets INTEGER DEFAULT 0,
    ticket_price INTEGER NOT NULL,
    
    -- Features
    has_interactive_map BOOLEAN DEFAULT false,
    has_friend_tracking BOOLEAN DEFAULT false,
    
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'sold_out', 'completed', 'cancelled')),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Event Tickets
CREATE TABLE event_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES major_events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    ticket_number TEXT UNIQUE NOT NULL,
    qr_code TEXT UNIQUE NOT NULL,
    
    -- Transfer restrictions
    is_transferable BOOLEAN DEFAULT false,
    original_user_id UUID,
    
    -- Check-in
    is_checked_in BOOLEAN DEFAULT false,
    checked_in_at TIMESTAMPTZ,
    
    status TEXT DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'cancelled', 'transferred')),
    
    purchased_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Friend Event Locations
CREATE TABLE friend_event_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES major_events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    
    is_visible BOOLEAN DEFAULT true,
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(event_id, user_id)
);

-- ============================================
// 6.9: CORPORATE & PRIVATE EVENTS
-- ============================================

-- Table: Corporate Clients
CREATE TABLE corporate_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    company_name TEXT NOT NULL,
    company_email TEXT NOT NULL,
    company_phone TEXT,
    company_address TEXT,
    
    contact_person TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    
    industry TEXT,
    employee_count INTEGER,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Corporate Bookings
CREATE TABLE corporate_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporate_client_id UUID REFERENCES corporate_clients(id) ON DELETE SET NULL,
    venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
    
    -- Event details
    event_name TEXT NOT NULL,
    event_date DATE NOT NULL,
    expected_guests INTEGER NOT NULL,
    
    -- Package
    package_type TEXT, -- 'standard', 'premium', 'luxury'
    package_price INTEGER,
    f_and_b_budget INTEGER,
    
    -- Quotation
    quotation_pdf_url TEXT,
    quotation_status TEXT DEFAULT 'draft', -- 'draft', 'sent', 'accepted', 'rejected'
    
    -- Status
    status TEXT DEFAULT 'inquiry' CHECK (status IN ('inquiry', 'quoted', 'negotiating', 'confirmed', 'completed', 'cancelled')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
// 6.10: BIG DATA ANALYTICS
-- ============================================

-- Table: Analytics Snapshots
CREATE TABLE analytics_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Time period
    snapshot_date DATE NOT NULL,
    city_id UUID REFERENCES cities(id),
    
    -- Metrics
    total_visits INTEGER DEFAULT 0,
    total_revenue INTEGER DEFAULT 0,
    total_bookings INTEGER DEFAULT 0,
    
    -- Top venues
    top_venues JSONB DEFAULT '[]',
    
    -- Category breakdown
    category_breakdown JSONB DEFAULT '{}',
    
    -- Trending
    trending_venues JSONB DEFAULT '[]',
    trending_genres JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Brand Insights
CREATE TABLE brand_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    brand_name TEXT NOT NULL,
    
    -- Location
    city_id UUID REFERENCES cities(id),
    
    -- Data
    data_type TEXT NOT NULL, -- 'drink_trend', 'genre_trend', 'spending_pattern'
    data JSONB NOT NULL,
    
    -- Privacy
    is_anonymized BOOLEAN DEFAULT true,
    
    -- Pricing
    is_paid BOOLEAN DEFAULT false,
    price INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
// FUNCTIONS
-- ============================================

-- Function: Calculate tax-inclusive price
CREATE OR REPLACE FUNCTION calculate_tax(
    p_amount INTEGER,
    p_tax_rate FLOAT,
    p_is_inclusive BOOLEAN
)
RETURNS TABLE (net_amount INTEGER, tax_amount INTEGER, gross_amount INTEGER) AS $$
BEGIN
    IF p_is_inclusive THEN
        -- Price includes tax
        RETURN QUERY SELECT
            ROUND(p_amount / (1 + p_tax_rate))::INTEGER,
            ROUND(p_amount - (p_amount / (1 + p_tax_rate)))::INTEGER,
            p_amount;
    ELSE
        -- Tax added on top
        RETURN QUERY SELECT
            p_amount,
            ROUND(p_amount * p_tax_rate)::INTEGER,
            p_amount + ROUND(p_amount * p_tax_rate)::INTEGER;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: Check ladies night eligibility
CREATE OR REPLACE FUNCTION check_ladies_night_eligibility(
    p_guest_list_id UUID,
    p_gender TEXT,
    p_entry_time TIME
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_list RECORD;
BEGIN
    SELECT * INTO v_list FROM guest_lists WHERE id = p_guest_list_id;
    
    IF NOT v_list.is_ladies_night OR p_gender != 'female' THEN
        RETURN jsonb_build_object(
            'eligible', false,
            'reason', 'Not a ladies night or not eligible'
        );
    END IF;
    
    IF p_entry_time > v_list.ladies_entry_cutoff THEN
        RETURN jsonb_build_object(
            'eligible', false,
            'reason', 'Past ladies night cutoff time',
            'discount_percentage', 0
        );
    END IF;
    
    RETURN jsonb_build_object(
        'eligible', true,
        'discount_percentage', v_list.ladies_discount_percentage,
        'reason', 'Free entry before ' || v_list.ladies_entry_cutoff
    );
END;
$$ LANGUAGE plpgsql;

-- Function: Track influencer conversion
CREATE OR REPLACE FUNCTION track_influencer_conversion(
    p_influencer_id UUID,
    p_booking_id UUID,
    p_platform TEXT
)
RETURNS UUID AS $$
DECLARE
    v_conversion_id UUID;
    v_commission INTEGER;
    v_campaign RECORD;
BEGIN
    -- Get campaign (if any)
    SELECT * INTO v_campaign FROM influencer_campaigns
    WHERE venue_id = (SELECT venue_id FROM bookings WHERE id = p_booking_id)
    AND status = 'active'
    LIMIT 1;
    
    -- Calculate commission
    IF v_campaign IS NOT NULL THEN
        v_commission := v_campaign.commission_per_booking;
    ELSE
        v_commission := 50000;
    END IF;
    
    -- Create conversion
    INSERT INTO influencer_conversions (
        influencer_id,
        campaign_id,
        booking_id,
        user_id,
        platform,
        commission_amount
    ) VALUES (
        p_influencer_id,
        v_campaign.id,
        p_booking_id,
        (SELECT user_id FROM bookings WHERE id = p_booking_id),
        p_platform,
        v_commission
    )
    RETURNING id INTO v_conversion_id;
    
    -- Update influencer stats
    UPDATE influencer_profiles SET
        total_conversions = total_conversions + 1,
        pending_payout = pending_payout + v_commission
    WHERE id = p_influencer_id;
    
    RETURN v_conversion_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
// RLS POLICIES
-- ============================================

ALTER TABLE tax_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_tax_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE international_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE tourist_venue_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_list_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_venue_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bottle_lockers ENABLE ROW LEVEL SECURITY;
ALTER TABLE major_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_event_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_insights ENABLE ROW LEVEL SECURITY;

-- Tax configs: Admin only
CREATE POLICY "Admin manage tax" ON tax_configs FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- Guest lists: Venue owners manage
CREATE POLICY "Owners manage guest lists" ON guest_lists FOR ALL USING (
    venue_id IN (SELECT id FROM venues WHERE owner_id = auth.uid())
);

-- Guest entries: Users manage own
CREATE POLICY "Users manage own entries" ON guest_list_entries FOR ALL USING (
    user_id = auth.uid()
);

-- Influencer: Users manage own
CREATE POLICY "Users manage own influencer" ON influencer_profiles FOR ALL USING (
    user_id = auth.uid()
);

-- SOS: Users manage own
CREATE POLICY "Users manage own sos" ON sos_events FOR ALL USING (
    user_id = auth.uid()
);

-- Bottle lockers: Users manage own
CREATE POLICY "Users manage own bottles" ON bottle_lockers FOR ALL USING (
    user_id = auth.uid()
);

-- Corporate: Admin manage
CREATE POLICY "Admin manage corporate" ON corporate_clients FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- Brand insights: Public read
CREATE POLICY "Public read brand insights" ON brand_insights FOR SELECT USING (true);
