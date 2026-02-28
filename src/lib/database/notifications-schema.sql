-- ============================================================
-- NOTIFICATION LOGS TABLE
-- NightLife ID - Automated WhatsApp Notifications
-- ============================================================

-- Create notification_logs table
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) NOT NULL,
  message_content TEXT NOT NULL,
  provider VARCHAR(20) NOT NULL DEFAULT 'wati', -- 'wati', 'twilio', 'fazz'
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
  error_message TEXT,
  message_id VARCHAR(100),
  reservation_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  recipient_type VARCHAR(20), -- 'venue', 'guest'
  retry_count INT DEFAULT 0,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notification_logs
CREATE INDEX idx_notification_logs_status ON notification_logs(status);
CREATE INDEX idx_notification_logs_reservation ON notification_logs(reservation_id);
CREATE INDEX idx_notification_logs_created ON notification_logs(created_at DESC);
CREATE INDEX idx_notification_logs_phone ON notification_logs(phone_number);

-- Enable RLS
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role to insert/update
DROP POLICY IF EXISTS "Service role can manage notification_logs" ON notification_logs;
CREATE POLICY "Service role can manage notification_logs"
  ON notification_logs FOR ALL
  USING (true)
  WITH CHECK (true);
