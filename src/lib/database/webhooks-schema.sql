-- ============================================================
-- SUPABASE DATABASE WEBHOOKS & EDGE FUNCTION TRIGGERS
-- NightLife ID - Automated Notification Engine
-- ============================================================

-- ============================================================
-- 1. CREATE OR REPLACE THE EDGE FUNCTION
-- ============================================================

-- Note: This SQL doesn't deploy the Edge Function directly.
-- Deploy using: supabase functions deploy send-booking-notification

-- ============================================================
-- 2. CREATE DATABASE WEBHOOK TRIGGER
-- ============================================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_reservation_status_change ON bookings;

-- Create the trigger function
CREATE OR REPLACE FUNCTION notify_booking_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify via webhook when status changes to confirmed
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    PERFORM (
      SELECT net.http_post(
        url := COALESCE(
          current_setting('app.webhook_url', true),
          (SELECT value FROM app_config WHERE key = 'webhook_url')
        ) || '/functions/v1/send-booking-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
        ),
        body := jsonb_build_object(
          'type', 'UPDATE',
          'record', NEW,
          'old_record', OLD
        )
      )
    );
  END IF;

  -- Notify on new INSERT
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    PERFORM (
      SELECT net.http_post(
        url := COALESCE(
          current_setting('app.webhook_url', true),
          (SELECT value FROM app_config WHERE key = 'webhook_url')
        ) || '/functions/v1/send-booking-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
        ),
        body := jsonb_build_object(
          'type', 'INSERT',
          'record', NEW,
          'old_record', NULL
        )
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on bookings table
CREATE TRIGGER on_reservation_status_change
AFTER INSERT OR UPDATE OF status ON bookings
FOR EACH ROW
WHEN (NEW.status = 'confirmed')
EXECUTE FUNCTION notify_booking_change();

-- ============================================================
-- 3. ENABLE POSTGREST EXTENSION FOR HTTP REQUESTS
-- ============================================================

-- Enable http extension for webhook calls (if not already enabled)
CREATE EXTENSION IF NOT EXISTS http;

-- ============================================================
-- 4. APP CONFIG TABLE (Optional - for dynamic webhook URL)
-- ============================================================

CREATE TABLE IF NOT EXISTS app_config (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default webhook URL (update this after deployment)
INSERT INTO app_config (key, value, description) 
VALUES 
  ('webhook_url', 'https://your-project.supabase.co', 'Base URL for Edge Functions')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 5. WHATSAPP LOGS ENHANCEMENT
-- ============================================================

-- Add additional tracking columns to whatsapp_logs if needed
ALTER TABLE whatsapp_logs 
ADD COLUMN IF NOT EXISTS reservation_id UUID REFERENCES bookings(id),
ADD COLUMN IF NOT EXISTS recipient_type VARCHAR(20) DEFAULT 'venue', -- 'venue' or 'guest'
ADD COLUMN IF NOT EXISTS message_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(20) DEFAULT 'pending'; -- 'pending', 'sent', 'delivered', 'failed'

-- ============================================================
-- 6. ENVIRONMENT VARIABLES CHECK (For Edge Function)
-- ============================================================

/*
Required Environment Variables for Edge Function:

1. SUPABASE_URL - Your Supabase project URL
2. SUPABASE_SERVICE_ROLE_KEY - Service role key for admin operations
3. WHATSAPP_API_KEY - API key for WhatsApp provider
4. WHATSAPP_PHONE_NUMBER - Business phone number
5. WHATSAPP_PROVIDER - 'twilio', 'wati', or 'fazz'
6. DASHBOARD_URL - Base URL for dashboard links
7. DEFAULT_OWNER_PHONE - Fallback phone for testing

Provider-specific:
- Twilio: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
- Wati: (uses WHATSAPP_API_KEY)
- Fazz: (uses WHATSAPP_API_KEY)

Deploy command:
  supabase functions deploy send-booking-notification --no-verify-jwt

Set secrets:
  supabase secrets set WHATSAPP_API_KEY=your_api_key
  supabase secrets set WHATSAPP_PHONE_NUMBER=your_phone_number
  supabase secrets set WHATSAPP_PROVIDER=twilio
  supabase secrets set DASHBOARD_URL=https://nightlife.id/dashboard
*/

-- ============================================================
-- 7. TEST THE WEBHOOK (Optional - for debugging)
-- ============================================================

/*
-- Test trigger function manually:
INSERT INTO bookings (
  venue_id, 
  user_id, 
  booking_code,
  booking_date,
  booking_time,
  guest_count,
  guest_name,
  guest_phone,
  status,
  total_amount
) VALUES (
  'test-venue-id',
  'test-user-id',
  'VIBE-TEST-001',
  '2024-12-25',
  '21:00',
  4,
  'Test Guest',
  '+62812345678',
  'confirmed',
  500000
);

-- Check logs:
SELECT * FROM whatsapp_logs ORDER BY created_at DESC LIMIT 10;
*/
