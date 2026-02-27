-- =====================================================
-- SALES INTELLIGENCE & INVENTORY SCHEMA - PHASE 3.4
-- Referral System, Table Inventory, WhatsApp Automation
-- =====================================================

-- =====================================================
// 1. REFERRAL LINKS (Personal Booking Links)
// =====================================================

CREATE TABLE IF NOT EXISTS referral_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  marketing_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Link Details
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255), -- "Birthday Promo", "Weekend Special", etc.
  description TEXT,
  
  -- Analytics
  total_clicks INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  total_revenue NUMERIC(15,2) DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  
  -- Attribution
  discount_percentage INTEGER DEFAULT 0,
  bonus_points INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referral Conversions (track each booking)
CREATE TABLE IF NOT EXISTS referral_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_link_id UUID NOT NULL REFERENCES referral_links(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id),
  invoice_id UUID REFERENCES invoices(id),
  guest_name VARCHAR(255),
  guest_phone VARCHAR(20),
  revenue NUMERIC(15,2) DEFAULT 0,
  converted_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
// 2. VENUE INVENTORY (Table/Room Management)
// =====================================================

CREATE TABLE IF NOT EXISTS venue_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  
  -- Item Details
  label VARCHAR(100) NOT NULL, -- "Table 1", "VIP Room A", "Sofa 5"
  type VARCHAR(50) NOT NULL, -- 'table', 'sofa', 'room', 'booth', 'vip'
  location VARCHAR(100), -- "Main Floor", "Rooftop", "VIP Section"
  
  -- Capacity
  min_capacity INTEGER DEFAULT 2,
  max_capacity INTEGER DEFAULT 8,
  
  -- Pricing
  minimum_spend NUMERIC(15,2) DEFAULT 0,
  hourly_rate NUMERIC(15,2) DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'available', -- 'available', 'booked', 'occupied', 'maintenance', 'closed'
  current_reservation_id UUID,
  
  -- Amenities
  amenities JSONB DEFAULT '[]'::jsonb, -- ['wifi', 'tv', 'sound_system']
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Reservations (when tables are booked)
CREATE TABLE IF NOT EXISTS inventory_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES venue_inventory(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id),
  guest_name VARCHAR(255),
  guest_phone VARCHAR(20),
  
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed', -- 'pending', 'confirmed', 'checked_in', 'completed', 'cancelled'
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
// 3. WHATSAPP AUTOMATION
// =====================================================

CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id),
  
  name VARCHAR(100) NOT NULL, -- "Booking Confirmation", "Payment Received", "Reminder"
  event_trigger VARCHAR(50) NOT NULL, -- 'invoice_paid', 'reservation_created', 'reminder_24h', 'thank_you'
  
  -- Template Content
  body_template TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb, -- ['guest_name', 'venue_name', 'booking_time']
  
  -- Media (optional)
  media_url TEXT,
  media_type VARCHAR(20), -- 'image', 'video', 'document'
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id),
  
  recipient_phone VARCHAR(20) NOT NULL,
  template_id UUID REFERENCES whatsapp_templates(id),
  
  -- Message Details
  message_text TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'read', 'failed'
  whatsapp_message_id TEXT,
  
  -- Context
  related_invoice_id UUID,
  related_reservation_id UUID,
  
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
// 4. MARKETING PERFORMANCE
// =====================================================

CREATE TABLE IF NOT EXISTS marketing_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  marketing_id UUID NOT NULL REFERENCES profiles(id),
  
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Metrics
  referral_clicks INTEGER DEFAULT 0,
  referral_conversions INTEGER DEFAULT 0,
  referral_revenue NUMERIC(15,2) DEFAULT 0,
  
  promo_clicks INTEGER DEFAULT 0,
  promo_conversions INTEGER DEFAULT 0,
  promo_revenue NUMERIC(15,2) DEFAULT 0,
  
  total_revenue NUMERIC(15,2) DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
// INDEXES
// =====================================================

CREATE INDEX IF NOT EXISTS idx_referral_links_venue ON referral_links(venue_id, marketing_id);
CREATE INDEX IF NOT EXISTS idx_referral_links_code ON referral_links(code);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_link ON referral_conversions(referral_link_id);
CREATE INDEX IF NOT EXISTS idx_venue_inventory_venue ON venue_inventory(venue_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_time ON inventory_reservations(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_phone ON whatsapp_logs(recipient_phone);
CREATE INDEX IF NOT EXISTS idx_marketing_performance_period ON marketing_performance(marketing_id, period_start);

-- =====================================================
// RLS POLICIES
// =====================================================

ALTER TABLE referral_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_performance ENABLE ROW LEVEL SECURITY;

-- Referral links - marketing sees their own, owners see all
CREATE POLICY "Marketing see own referrals" ON referral_links FOR SELECT
  USING (marketing_id = auth.uid());

CREATE POLICY "Owners see all referrals" ON referral_links FOR SELECT
  USING (venue_id IN (SELECT id FROM venues WHERE owner_id = auth.uid()));

-- Inventory - venue staff can manage
CREATE POLICY "Staff manage inventory" ON venue_inventory FOR ALL
  USING (venue_id IN (
    SELECT venue_id FROM staff_invitations WHERE user_id = auth.uid() AND status = 'accepted'
  ));

-- WhatsApp - owners manage
CREATE POLICY "Owners manage WhatsApp" ON whatsapp_templates FOR ALL
  USING (venue_id IN (SELECT id FROM venues WHERE owner_id = auth.uid()));

-- =====================================================
// FUNCTIONS
// =====================================================

-- Generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(venue_slug TEXT, user_id UUID)
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  suffix TEXT;
BEGIN
  suffix := SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4);
  code := UPPER(venue_slug) || suffix;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Track referral click
CREATE OR REPLACE FUNCTION track_referral_click(p_code TEXT)
RETURNS void AS $$
BEGIN
  UPDATE referral_links 
  SET total_clicks = total_clicks + 1,
      updated_at = NOW()
  WHERE code = p_code AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Track referral conversion
CREATE OR REPLACE FUNCTION track_referral_conversion(
  p_code TEXT,
  p_reservation_id UUID,
  p_invoice_id UUID,
  p_guest_name TEXT,
  p_guest_phone TEXT,
  p_revenue NUMERIC
)
RETURNS void AS $$
DECLARE
  v_link_id UUID;
BEGIN
  -- Get referral link
  SELECT id INTO v_link_id 
  FROM referral_links 
  WHERE code = p_code AND is_active = true;
  
  IF v_link_id IS NOT NULL THEN
    -- Record conversion
    INSERT INTO referral_conversions (
      referral_link_id, reservation_id, invoice_id, 
      guest_name, guest_phone, revenue
    ) VALUES (
      v_link_id, p_reservation_id, p_invoice_id,
      p_guest_name, p_guest_phone, p_revenue
    );
    
    -- Update link stats
    UPDATE referral_links 
    SET total_conversions = total_conversions + 1,
        total_revenue = total_revenue + p_revenue,
        updated_at = NOW()
    WHERE id = v_link_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Update inventory status
CREATE OR REPLACE FUNCTION update_inventory_status(
  p_inventory_id UUID,
  p_status VARCHAR,
  p_reservation_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE venue_inventory
  SET status = p_status,
      current_reservation_id = p_reservation_id,
      updated_at = NOW()
  WHERE id = p_inventory_id;
END;
$$ LANGUAGE plpgsql;
