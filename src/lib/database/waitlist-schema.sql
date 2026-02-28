-- ============================================================
-- WAITLIST LEADS TABLE
-- NightLife ID - Web3 Coming Soon Page
-- ============================================================

-- Create waitlist_leads table (idempotent - safe to run multiple times)
CREATE TABLE IF NOT EXISTS waitlist_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  phone VARCHAR(20),
  source VARCHAR(50) DEFAULT 'web3_page', -- 'web3_page', 'early_access', etc.
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'contacted', 'converted'
  referral_code VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for waitlist queries
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist_leads(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist_leads(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_created ON waitlist_leads(created_at DESC);

-- Enable Row Level Security (PostgreSQL)
ALTER TABLE waitlist_leads ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Allow public to insert waitlist leads" ON waitlist_leads;
CREATE POLICY "Allow public to insert waitlist leads"
  ON waitlist_leads FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service role to manage waitlist" ON waitlist_leads;
CREATE POLICY "Allow service role to manage waitlist"
  ON waitlist_leads FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Function: Update updated_at timestamp on row update
CREATE OR REPLACE FUNCTION update_waitlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at on any row modification
DROP TRIGGER IF EXISTS set_waitlist_updated_at ON waitlist_leads;
CREATE TRIGGER set_waitlist_updated_at
  BEFORE UPDATE ON waitlist_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_waitlist_updated_at();
