-- =====================================================
-- MERCHANT ONBOARDING & COMMUNICATION LOGS
-- Automated WhatsApp Welcome Messages
-- =====================================================

-- 1. Communication Logs Table
CREATE TABLE IF NOT EXISTS communication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    message_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    external_message_id VARCHAR(100),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Venue Managers Table (if not exists)
CREATE TABLE IF NOT EXISTS venue_managers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
    
    -- Personal Info
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    whatsapp_number VARCHAR(20),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'suspended'
    role VARCHAR(50) DEFAULT 'owner', -- 'owner', 'manager', 'staff'
    
    -- Metadata
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES profiles(id),
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_communication_logs_recipient ON communication_logs(recipient_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_status ON communication_logs(status);
CREATE INDEX IF NOT EXISTS idx_venue_managers_status ON venue_managers(status);
CREATE INDEX IF NOT EXISTS idx_venue_managers_venue ON venue_managers(venue_id);

-- 4. RLS Policies
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_managers ENABLE ROW LEVEL SECURITY;

-- Communication logs - admins can view all
CREATE POLICY "Admins view all communications" ON communication_logs FOR SELECT
  USING (true);

-- Insert policies (for system use)
CREATE POLICY "System can insert communications" ON communication_logs FOR INSERT
  WITH CHECK (true);

-- Venue managers policies
CREATE POLICY "Admins manage venue managers" ON venue_managers FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 5. Database Trigger Function for Owner Approval
CREATE OR REPLACE FUNCTION notify_owner_approval()
RETURNS TRIGGER AS $$
DECLARE
    v_webhook_url TEXT;
    v_result JSON;
BEGIN
    -- Only trigger when status changes to 'approved'
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        
        -- Get webhook URL from environment or use default
        v_webhook_url := COALESCE(
            current_setting('app.settings.owner_approval_webhook', true),
            COALESCE(
                current_setting('app.settings.external_webhook_url', true),
                '/api/webhooks/owner-approval'
            )
        );
        
        -- Call the webhook asynchronously
        -- In production, you'd use a queue or background job
        PERFORM (
            SELECT net.http_post(
                url := v_webhook_url,
                body := jsonb_build_object(
                    'venue_manager_id', NEW.id,
                    'owner_name', NEW.full_name,
                    'whatsapp_number', NEW.whatsapp_number,
                    'venue_name', (SELECT name FROM venues WHERE id = NEW.venue_id),
                    'previous_status', OLD.status,
                    'new_status', NEW.status
                ),
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || COALESCE(current_setting('app.settings.webhook_secret', true), '')
                )
            )
        );
        
        -- Update approved_at timestamp
        NEW.approved_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_owner_approval ON venue_managers;
CREATE TRIGGER trigger_owner_approval
    AFTER UPDATE OF status ON venue_managers
    FOR EACH ROW
    EXECUTE FUNCTION notify_owner_approval();

-- 6. Function to manually trigger welcome message
CREATE OR REPLACE FUNCTION send_welcome_message(p_venue_manager_id UUID)
RETURNS void AS $$
DECLARE
    v_manager RECORD;
    v_webhook_url TEXT;
BEGIN
    -- Get manager details
    SELECT * INTO v_manager
    FROM venue_managers
    WHERE id = p_venue_manager_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Venue manager not found';
    END IF;
    
    -- Build webhook URL
    v_webhook_url := COALESCE(
        current_setting('app.settings.owner_approval_webhook', true),
        '/api/webhooks/owner-approval'
    );
    
    -- Call webhook (async in production)
    PERFORM (
        SELECT net.http_post(
            url := v_webhook_url,
            body := jsonb_build_object(
                'venue_manager_id', v_manager.id,
                'owner_name', v_manager.full_name,
                'whatsapp_number', v_manager.whatsapp_number,
                'venue_name', (SELECT name FROM venues WHERE id = v_manager.venue_id),
                'previous_status', 'pending',
                'new_status', 'approved'
            ),
            headers := jsonb_build_object(
                'Content-Type', 'application/json'
            )
        )
    );
END;
$$ LANGUAGE plpgsql;
