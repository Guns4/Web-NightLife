-- =====================================================
-- ENTERPRISE DATABASE SCHEMA - PHASE 3.2
-- Multi-Venue Management, RBAC 2.0, Lead CRM, Audit Logs
-- =====================================================

-- =====================================================
-- 1. MULTI-VENUE MANAGEMENT
-- =====================================================

-- Venues now have an owner_id that links to the user (one owner, many venues)
ALTER TABLE venues ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);
ALTER TABLE venues ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS venue_type VARCHAR(50) DEFAULT 'club'; -- club, karaoke, spa, bar

-- Venue branches - for multi-location owners
CREATE TABLE IF NOT EXISTS venue_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  phone VARCHAR(20),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. ADVANCED RBAC 2.0 - GRANULAR PERMISSIONS
-- =====================================================

-- Staff invitations with role and permissions
CREATE TABLE IF NOT EXISTS staff_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- owner, manager, marketing, ops, staff
  permissions JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, expired
  invited_by UUID REFERENCES auth.users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Audit Log
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_email VARCHAR(255),
  user_role VARCHAR(50),
  action VARCHAR(100) NOT NULL, -- create_promo, update_venue, view_analytics, etc.
  resource_type VARCHAR(50) NOT NULL, -- promo, venue, reservation, guest
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff Performance Tracking
CREATE TABLE IF NOT EXISTS staff_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action_type VARCHAR(50) NOT NULL, -- promo_updated, lead_responded, vibe_updated, etc.
  points INTEGER DEFAULT 1, -- Gamification points
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. MARKETING AUTOMATION & A/B TESTING
-- =====================================================

-- A/B Test Promos
CREATE TABLE IF NOT EXISTS promo_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft', -- draft, running, completed, paused
  
  -- Variant A
  variant_a_title VARCHAR(255),
  variant_a_description TEXT,
  variant_a_discount INTEGER,
  
  -- Variant B
  variant_b_title VARCHAR(255),
  variant_b_description TEXT,
  variant_b_discount INTEGER,
  
  -- Results
  variant_a_clicks INTEGER DEFAULT 0,
  variant_b_clicks INTEGER DEFAULT 0,
  variant_a_conversions INTEGER DEFAULT 0,
  variant_b_conversions INTEGER DEFAULT 0,
  
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-Boost Triggers
CREATE TABLE IF NOT EXISTS boost_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  condition_type VARCHAR(50) NOT NULL, -- clicks_spike, reservation_spike, review_score
  threshold JSONB NOT NULL, -- {"increase": 50, "timeframe_hours": 1}
  is_active BOOLEAN DEFAULT true,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social Media Posts (Cross-post preparation)
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  promo_id UUID REFERENCES promos(id),
  
  platform VARCHAR(20) NOT NULL, -- instagram, tiktok, twitter, facebook
  content TEXT NOT NULL,
  hashtags TEXT[],
  media_urls TEXT[],
  scheduled_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'draft', -- draft, scheduled, posted, failed
  
  -- AI Generated
  ai_caption BOOLEAN DEFAULT false,
  ai_hashtags BOOLEAN DEFAULT false,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. GUEST MANAGEMENT & LEAD CRM
-- =====================================================

-- Guest Profiles (VIP, Blacklist)
CREATE TABLE IF NOT EXISTS guest_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id), -- If registered user
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  
  -- Classification
  status VARCHAR(20) DEFAULT 'regular', -- regular, vip, blacklist, pending
  vip_tier VARCHAR(20), -- platinum, gold, silver
  total_visits INTEGER DEFAULT 0,
  total_spent DECIMAL(15,2) DEFAULT 0,
  last_visit TIMESTAMPTZ,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lead Pipeline (Kanban)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  
  -- Contact Info
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  source VARCHAR(50), -- whatsapp, website, instagram, referral
  
  -- Pipeline Status
  stage VARCHAR(20) DEFAULT 'todo', -- todo, contacted, booked, visited, lost
  value DECIMAL(15,2), -- Potential booking value
  notes TEXT,
  
  assigned_to UUID REFERENCES auth.users(id),
  next_follow_up TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lead Activity (for tracking)
CREATE TABLE IF NOT EXISTS lead_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(50) NOT NULL, -- created, stage_changed, note_added, call_made
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. ANALYTICS ENHANCEMENTS
-- =====================================================

-- Revenue Attribution
CREATE TABLE IF NOT EXISTS revenue_attribution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  
  date DATE NOT NULL,
  source VARCHAR(50) NOT NULL, -- whatsapp_lead, table_booking, walk_in, promo_click
  
  potential_revenue DECIMAL(15,2) DEFAULT 0,
  actual_revenue DECIMAL(15,2) DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Peak Hour Analytics
CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  
  hour INTEGER NOT NULL, -- 0-23
  day_of_week INTEGER NOT NULL, -- 0-6
  search_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competitor Benchmarking
CREATE TABLE IF NOT EXISTS competitor_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  competitor_venue_id UUID REFERENCES venues(id),
  
  vibe_score INTEGER, -- 0-100
  crowd_level INTEGER, -- 0-100
  value_score INTEGER, -- 0-100
  review_score DECIMAL(3,2),
  
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. REALTIME PRESENCE
-- =====================================================

-- Dashboard Presence (for showing who else is viewing)
CREATE TABLE IF NOT EXISTS dashboard_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth/users(id),
  page VARCHAR(100) NOT NULL,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (venue_id, user_id, page)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_venue ON audit_logs(venue_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_activity_user ON staff_activity(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_venue_stage ON leads(venue_id, stage);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_to, stage);
CREATE INDEX IF NOT EXISTS idx_guest_profiles_status ON guest_profiles(venue_id, status);
CREATE INDEX IF NOT EXISTS idx_revenue_attribution_date ON revenue_attribution(venue_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_search_analytics_hour ON search_analytics(venue_id, hour);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Audit logs readable by all staff
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view audit logs" ON audit_logs FOR SELECT 
  USING (venue_id IN (SELECT venue_id FROM staff_invitations WHERE user_id = auth.uid() AND status = 'accepted'));

-- Leads visible to assigned staff and owner
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can view leads" ON leads FOR SELECT 
  USING (venue_id IN (SELECT venue_id FROM staff_invitations WHERE user_id = auth.uid() AND status = 'accepted'));

-- Guest profiles - similar rules
ALTER TABLE guest_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can view guests" ON guest_profiles FOR SELECT 
  USING (venue_id IN (SELECT venue_id FROM staff_invitations WHERE user_id = auth.uid() AND status = 'accepted'));
