-- =====================================================
-- ADMIN ONE-TIME TOKENS
-- For secure, time-limited admin access links
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_one_time_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_tokens_token ON admin_one_time_tokens(token);
CREATE INDEX idx_admin_tokens_user ON admin_one_time_tokens(user_id);
CREATE INDEX idx_admin_tokens_expires ON admin_one_time_tokens(expires_at);

-- =====================================================
-- CRON JOB LOGS
-- Track scheduled job executions
-- =====================================================

CREATE TABLE IF NOT EXISTS cron_job_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name TEXT NOT NULL,
    status TEXT NOT NULL, -- 'success', 'failed', 'running'
    error_message TEXT,
    metadata JSONB,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cron_job_name ON cron_job_logs(job_name);
CREATE INDEX idx_cron_status ON cron_job_logs(status);
CREATE INDEX idx_cron_executed ON cron_job_logs(executed_at);

-- Enable RLS
ALTER TABLE admin_one_time_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE cron_job_logs ENABLE ROW LEVEL SECURITY;

-- Policies
-- Service role can manage tokens
CREATE POLICY "Service manage tokens" ON admin_one_time_tokens
    FOR ALL USING (auth.role() = 'service_role');

-- Service role can manage cron logs
CREATE POLICY "Service manage cron logs" ON cron_job_logs
    FOR ALL USING (auth.role() = 'service_role');
