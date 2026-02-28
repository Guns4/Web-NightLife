-- =====================================================
-- PARTNER API KEYS & MANAGEMENT
-- AfterHoursID B2B Partner Platform
-- =====================================================

-- Partner API Keys Table
CREATE TABLE IF NOT EXISTS partner_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    key_prefix VARCHAR(20) NOT NULL, -- First 8 chars for identification (e.g., "ah_live_")
    name VARCHAR(100) NOT NULL, -- e.g., "Production Key", "Development Key"
    scopes JSONB NOT NULL DEFAULT '[]', -- e.g., ["read:venues", "read:promos", "write:reservations"]
    rate_limit_quota INTEGER NOT NULL DEFAULT 1000, -- Requests per day
    rate_limit_window INTEGER NOT NULL DEFAULT 86400, -- Window in seconds (1 day)
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_scopes CHECK (
        scopes ?& array['read:venues', 'read:promos', 'write:reservations', 'read:analytics', 'read:events']
    )
);

-- Partners Table
CREATE TABLE IF NOT EXISTS partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    website VARCHAR(500),
    description TEXT,
    logo_url VARCHAR(500),
    
    -- Partner Tiers
    tier VARCHAR(50) NOT NULL DEFAULT 'basic' CHECK (tier IN ('basic', 'professional', 'enterprise')),
    
    -- Branding Options
    primary_color VARCHAR(7) DEFAULT '#FFD700', -- Gold default
    custom_domain VARCHAR(255),
    
    -- Webhook Configuration
    webhook_url VARCHAR(500),
    webhook_secret VARCHAR(255),
    webhook_events JSONB DEFAULT '[]', -- e.g., ["promo.created", "venue.updated"]
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'cancelled')),
    
    -- Usage Tracking
    total_requests INTEGER NOT NULL DEFAULT 0,
    monthly_requests INTEGER NOT NULL DEFAULT 0,
    last_request_at TIMESTAMP WITH TIME ZONE,
    
    -- Contact
    contact_name VARCHAR(255),
    contact_phone VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partner API Usage Logs (for analytics)
CREATE TABLE IF NOT EXISTS partner_api_logs (
    id BIGSERIAL PRIMARY KEY,
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    api_key_id UUID NOT NULL REFERENCES partner_api_keys(id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER NOT NULL,
    request_ip INET,
    request_user_agent TEXT,
    request_body JSONB,
    response_body JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partner Webhooks Log
CREATE TABLE IF NOT EXISTS partner_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'retrying')),
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    response_status INTEGER,
    response_body TEXT,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_partner_api_keys_partner_id ON partner_api_keys(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_api_keys_key_hash ON partner_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_partner_api_keys_active ON partner_api_keys(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_partner_api_logs_partner_id ON partner_api_logs(partner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_api_logs_endpoint ON partner_api_logs(endpoint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_webhooks_partner_id ON partner_webhooks(partner_id, status);
CREATE INDEX IF NOT EXISTS idx_partner_webhooks_pending ON partner_webhooks(status, next_retry_at) WHERE status IN ('pending', 'retrying');

-- Valid Scopes (for reference)
-- read:venues - Read venue listings
-- read:promos - Read promotional content
-- read:events - Read event listings
-- read:analytics - Read analytics data
-- write:reservations - Make reservations on behalf of users

-- Add foreign key to partners from api_keys
ALTER TABLE partner_api_keys 
ADD CONSTRAINT fk_partner_keys_partner 
FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE;
