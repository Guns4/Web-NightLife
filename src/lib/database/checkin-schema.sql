-- ============================================
-- PHASE 4.2: PHYSICAL-DIGITAL INTEGRATION
-- Check-in System: NFC, QR, TOTP Security
-- ============================================

-- Table: Check-ins
-- Records user presence at venues with multiple verification methods
CREATE TABLE IF NOT EXISTS checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
  station_id UUID REFERENCES venue_stations(id) ON DELETE SET NULL,
  
  -- Check-in method: nfc, qr, geofence, manual
  method TEXT NOT NULL DEFAULT 'qr' CHECK (method IN ('nfc', 'qr', 'geofence', 'manual')),
  
  -- Session ID prevents double check-ins (one per venue per session)
  session_id TEXT UNIQUE NOT NULL,
  
  -- Timestamps
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checked_out_at TIMESTAMPTZ,
  
  -- XP awarded for this check-in
  xp_awarded INTEGER NOT NULL DEFAULT 50,
  
  -- Metadata
  device_info JSONB DEFAULT '{}',
  location_coordinates POINT,
  
  -- TOTP validation
  totp_verified BOOLEAN DEFAULT false,
  totp_timestamp TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'checked_out', 'flagged', 'invalid')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_checkins_user_id ON checkins(user_id);
CREATE INDEX idx_checkins_venue_id ON checkins(venue_id);
CREATE INDEX idx_checkins_session_id ON checkins(session_id);
CREATE INDEX idx_checkins_timestamp ON checkins(timestamp DESC);
CREATE INDEX idx_checkins_status ON checkins(status);

-- Table: Venue Stations
-- Physical stations at venues (entrances, tables, VIP areas)
CREATE TABLE IF NOT EXISTS venue_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
  
  -- Station details
  name TEXT NOT NULL,
  station_type TEXT NOT NULL CHECK (station_type IN ('reception', 'table_vip', 'table_regular', 'bar', 'vip_area', 'outdoor')),
  
  -- Secret key for signing check-in URLs (TOTP seed)
  secret_key TEXT UNIQUE NOT NULL,
  
  -- QR code configuration
  qr_code_url TEXT,
  qr_color TEXT DEFAULT '#C026D3',
  
  -- NFC configuration
  nfc_tag_id TEXT UNIQUE,
  nfc_writeable BOOLEAN DEFAULT true,
  
  -- TOTP settings
  totp_enabled BOOLEAN DEFAULT true,
  totp_period INTEGER DEFAULT 30, -- seconds
  totp_digits INTEGER DEFAULT 6,
  
  -- Station status
  is_active BOOLEAN DEFAULT true,
  is_online BOOLEAN DEFAULT true,
  
  -- Pricing/Access
  min_tier_access TEXT DEFAULT 'bronze', -- bronze, silver, gold, platinum
  cover_charge INTEGER DEFAULT 0,
  
  -- Analytics
  total_checkins INTEGER DEFAULT 0,
  last_checkin_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_venue_stations_venue_id ON venue_stations(venue_id);
CREATE INDEX idx_venue_stations_station_type ON venue_stations(station_type);
CREATE INDEX idx_venue_stations_secret_key ON venue_stations(secret_key);

-- Table: Check-in Notifications
-- Real-time notifications for friends when someone checks in
CREATE TABLE IF NOT EXISTS checkin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_id UUID REFERENCES checkins(id) ON DELETE CASCADE NOT NULL,
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Notification details
  message TEXT NOT NULL,
  notification_type TEXT DEFAULT 'friend_checkin' CHECK (notification_type IN ('friend_checkin', 'squad_checkin', 'vip_arrival', 'squad_bonus')),
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  sent_via TEXT DEFAULT 'realtime', -- realtime, push, sms
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX idx_checkin_notifications_recipient ON checkin_notifications(recipient_user_id);
CREATE INDEX idx_checkin_notifications_checkin ON checkin_notifications(checkin_id);

-- Table: Offline Check-in Queue
-- For sync when internet is spotty
CREATE TABLE IF NOT EXISTS offline_checkin_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  venue_id UUID NOT NULL,
  station_id UUID,
  
  -- Queued data
  method TEXT NOT NULL,
  device_info JSONB DEFAULT '{}',
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Sync status
  synced BOOLEAN DEFAULT false,
  synced_at TIMESTAMPTZ,
  sync_error TEXT
);

CREATE INDEX idx_offline_queue_synced ON offline_checkin_queue(synced);

-- Table: Station Analytics
-- Real-time crowd status
CREATE TABLE IF NOT EXISTS station_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID REFERENCES venue_stations(id) ON DELETE CASCADE NOT NULL,
  
  -- Time bucket (every 5 minutes)
  time_bucket TIMESTAMPTZ NOT NULL,
  
  -- Metrics
  checkin_count INTEGER DEFAULT 0,
  checkout_count INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  avg_dwell_time_minutes INTEGER,
  
  -- Temperature/occupancy estimation
  occupancy_level INTEGER DEFAULT 0 CHECK (occupancy_level BETWEEN 0 AND 100),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_station_analytics_station ON station_analytics(station_id, time_bucket DESC);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function: Generate TOTP for station
CREATE OR REPLACE FUNCTION generate_station_totp(p_station_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_secret TEXT;
  v_period INTEGER;
  v_timestamp BIGINT;
  v_otp TEXT;
BEGIN
  -- Get station secret and period
  SELECT secret_key, totp_period INTO v_secret, v_period
  FROM venue_stations
  WHERE id = p_station_id AND is_active = true;
  
  IF v_secret IS NULL THEN
    RAISE EXCEPTION 'Station not found or inactive';
  END IF;
  
  -- Calculate TOTP (simplified - in production use proper HOTP/TOTP algorithm)
  v_timestamp := FLOOR(EXTRACT(EPOCH FROM NOW()) / v_period)::BIGINT;
  
  -- Generate 6-digit OTP using HMAC-SHA1 (simplified)
  v_otp := (
    SELECT encode(
      hmac(
        v_secret || v_timestamp::TEXT,
        v_secret,
        'sha1'
      ),
      'hex'
    )
  );
  
  -- Return last 6 characters as OTP
  RETURN UPPER(SUBSTRING(v_otp FROM LENGTH(v_otp) - 5 FOR 6));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Verify check-in session (prevent double check-ins)
CREATE OR REPLACE FUNCTION can_user_checkin(p_user_id UUID, p_venue_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_active_checkin INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_active_checkin
  FROM checkins
  WHERE user_id = p_user_id 
    AND venue_id = p_venue_id 
    AND status = 'active';
  
  RETURN v_active_checkin = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Award XP and update user stats
CREATE OR REPLACE FUNCTION award_checkin_xp(
  p_user_id UUID,
  p_venue_id UUID,
  p_bonus_multiplier NUMERIC DEFAULT 1.0
)
RETURNS INTEGER AS $$
DECLARE
  v_base_xp INTEGER := 50;
  v_final_xp INTEGER;
  v_new_total INTEGER;
  v_new_level INTEGER;
  v_current_xp INTEGER;
  v_xp_for_level INTEGER;
BEGIN
  -- Calculate final XP with multiplier
  v_final_xp := (v_base_xp * p_bonus_multiplier)::INTEGER;
  
  -- Get current user stats
  SELECT xp_total, level INTO v_current_xp, v_new_level
  FROM user_profiles
  WHERE id = p_user_id;
  
  -- Update XP
  v_new_total := COALESCE(v_current_xp, 0) + v_final_xp;
  
  -- Calculate new level (every 500 XP = 1 level)
  v_new_level := FLOOR(v_new_total / 500) + 1;
  v_xp_for_level := v_new_total - ((v_new_level - 1) * 500);
  
  -- Update user profile
  UPDATE user_profiles
  SET 
    xp_total = v_new_total,
    level = v_new_level,
    xp_in_current_level = v_xp_for_level,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN v_final_xp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Update venue station analytics on check-in
CREATE OR REPLACE FUNCTION update_station_analytics()
RETURNS TRIGGER AS $$
DECLARE
  v_time_bucket TIMESTAMPTZ;
  v_existing_id UUID;
BEGIN
  -- Calculate 5-minute time bucket
  v_time_bucket := DATE_TRUNC('minute', NEW.timestamp) + 
    (FLOOR(EXTRACT(MINUTE FROM NEW.timestamp)::INTEGER / 5) * INTERVAL '5 minute');
  
  -- Update or insert analytics
  INSERT INTO station_analytics (station_id, time_bucket, checkin_count, unique_visitors)
  VALUES (NEW.station_id, v_time_bucket, 1, 1)
  ON CONFLICT (station_id, time_bucket) 
  DO UPDATE SET 
    checkin_count = station_analytics.checkin_count + 1,
    unique_visitors = (
      SELECT COUNT(DISTINCT user_id) 
      FROM checkins 
      WHERE station_id = NEW.station_id 
        AND timestamp >= v_time_bucket - INTERVAL '5 minute'
        AND timestamp < v_time_bucket + INTERVAL '5 minute'
    );
  
  -- Update station total check-ins
  UPDATE venue_stations
  SET 
    total_checkins = total_checkins + 1,
    last_checkin_at = NEW.timestamp
  WHERE id = NEW.station_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_checkin_analytics
AFTER INSERT ON checkins
FOR EACH ROW
WHEN (NEW.station_id IS NOT NULL)
EXECUTE FUNCTION update_station_analytics();

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_checkin_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE station_analytics ENABLE ROW LEVEL SECURITY;

-- Check-ins: User can see own, venue owners can see venue's
CREATE POLICY "Users can view own checkins" ON checkins
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Venue owners can view venue checkins" ON checkins
  FOR SELECT USING (
    venue_id IN (
      SELECT id FROM venues WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own checkins" ON checkins
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Venue stations: Public can read, owners can manage
CREATE POLICY "Anyone can read active stations" ON venue_stations
  FOR SELECT USING (is_active = true);

CREATE POLICY "Venue owners can manage stations" ON venue_stations
  FOR ALL USING (
    venue_id IN (
      SELECT id FROM venues WHERE owner_id = auth.uid()
    )
  );

-- Notifications: Only recipient can read
CREATE POLICY "Users can read own notifications" ON checkin_notifications
  FOR SELECT USING (recipient_user_id = auth.uid());

-- Station analytics: Venue owners can view
CREATE POLICY "Owners can view station analytics" ON station_analytics
  FOR SELECT USING (
    station_id IN (
      SELECT id FROM venue_stations 
      WHERE venue_id IN (
        SELECT id FROM venues WHERE owner_id = auth.uid()
      )
    )
  );
