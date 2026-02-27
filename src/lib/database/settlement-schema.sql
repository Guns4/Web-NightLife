-- =====================================================
-- PLATFORM SETTLEMENT & REVENUE SCHEMA - PHASE 3.5
-- Merchant Payouts, Platform Earnings, Super Admin
-- =====================================================

-- =====================================================
// 1. PLATFORM EARNINGS (Fee Tracking)
// =====================================================

CREATE TABLE IF NOT EXISTS platform_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  
  -- Amount Details
  gross_amount NUMERIC(15,2) NOT NULL,
  platform_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 10,
  platform_fee_amount NUMERIC(15,2) NOT NULL,
  net_to_venue NUMERIC(15,2) NOT NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'released', 'hold'
  released_at TIMESTAMPTZ,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
// 2. PAYOUT REQUESTS
// =====================================================

CREATE TABLE IF NOT EXISTS payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  
  -- Payout Details
  amount NUMERIC(15,2) NOT NULL,
  bank_name VARCHAR(100) NOT NULL,
  bank_account_number VARCHAR(50) NOT NULL,
  bank_account_holder VARCHAR(255) NOT NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'requested', -- 'requested', 'processing', 'completed', 'rejected'
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Admin Review
  reviewed_by UUID REFERENCES profiles(id),
  rejection_reason TEXT,
  
  -- Transaction Reference
  transaction_reference TEXT,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
// 3. PLATFORM CONFIGURATION
-- =====================================================

CREATE TABLE IF NOT EXISTS platform_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default config
INSERT INTO platform value, description)_config (key, VALUES
  ('default_platform_fee', '10', 'Default platform fee percentage'),
  ('minimum_payout', '500000', 'Minimum payout amount in IDR'),
  ('payout_schedule', 'weekly', 'Payout schedule: daily, weekly, monthly');

-- =====================================================
// 4. PLATFORM REPORTS
-- =====================================================

CREATE TABLE IF NOT EXISTS platform_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Summary Metrics
  total_transactions INTEGER DEFAULT 0,
  total_gross_amount NUMERIC(15,2) DEFAULT 0,
  total_platform_fee NUMERIC(15,2) DEFAULT 0,
  total_payouts NUMERIC(15,2) DEFAULT 0,
  total_pending NUMERIC(15,2) DEFAULT 0,
  
  -- Venue Breakdown (JSON)
  venue_breakdown JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
// INDEXES
// =====================================================

CREATE INDEX IF NOT EXISTS idx_platform_earnings_venue ON platform_earnings(venue_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_earnings_status ON platform_earnings(status);
CREATE INDEX IF NOT EXISTS idx_payout_requests_venue ON payout_requests(venue_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_platform_reports_period ON platform_reports(report_type, period_start);

-- =====================================================
// RLS POLICIES
// =====================================================

ALTER TABLE platform_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_reports ENABLE ROW LEVEL SECURITY;

-- Platform earnings - venue owners see their own
CREATE POLICY "Owners see own earnings" ON platform_earnings FOR SELECT
  USING (venue_id IN (SELECT id FROM venues WHERE owner_id = auth.uid()));

-- Payout requests - venue owners see their own
CREATE POLICY "Owners see own payouts" ON payout_requests FOR ALL
  USING (venue_id IN (SELECT id FROM venues WHERE owner_id = auth.uid()));

-- Admin sees all
CREATE POLICY "Admin see all earnings" ON platform_earnings FOR SELECT
  USING (true);

CREATE POLICY "Admin see all payouts" ON payout_requests FOR SELECT
  USING (true);

CREATE POLICY "Admin manage payouts" ON payout_requests FOR ALL
  USING (true);

-- =====================================================
// FUNCTIONS
// =====================================================

-- Calculate and record platform fee from invoice
CREATE OR REPLACE FUNCTION calculate_platform_fee(p_invoice_id UUID)
RETURNS void AS $$
DECLARE
  v_invoice RECORD;
  v_fee_percent NUMERIC(5,2);
  v_fee_amount NUMERIC(15,2);
  v_net_amount NUMERIC(15,2);
BEGIN
  -- Get invoice
  SELECT * INTO v_invoice FROM invoices WHERE id = p_invoice_id;
  
  IF v_invoice.status != 'paid' THEN
    RAISE EXCEPTION 'Invoice must be paid to calculate fees';
  END IF;
  
  -- Get platform fee percentage
  SELECT CAST(value AS NUMERIC) INTO v_fee_percent 
  FROM platform_config WHERE key = 'default_platform_fee';
  
  -- Calculate fee
  v_fee_amount := v_invoice.total_amount * (v_fee_percent / 100);
  v_net_amount := v_invoice.total_amount - v_fee_amount;
  
  -- Insert earnings record
  INSERT INTO platform_earnings (
    invoice_id, venue_id, gross_amount,
    platform_fee_percent, platform_fee_amount, net_to_venue, status
  ) VALUES (
    p_invoice_id, v_invoice.venue_id, v_invoice.total_amount,
    v_fee_percent, v_fee_amount, v_net_amount, 'pending'
  );
END;
$$ LANGUAGE plpgsql;

-- Request payout
CREATE OR REPLACE FUNCTION request_payout(
  p_venue_id UUID,
  p_amount NUMERIC,
  p_bank_name TEXT,
  p_bank_account_number TEXT,
  p_bank_account_holder TEXT
)
RETURNS UUID AS $$
DECLARE
  v_available_balance NUMERIC(15,2);
  v_min_payout NUMERIC(15,2);
  v_request_id UUID;
BEGIN
  -- Get minimum payout
  SELECT CAST(value AS NUMERIC) INTO v_min_payout 
  FROM platform_config WHERE key = 'minimum_payout';
  
  -- Get available balance (released earnings)
  SELECT COALESCE(SUM(net_to_venue), 0) INTO v_available_balance
  FROM platform_earnings
  WHERE venue_id = p_venue_id AND status = 'released';
  
  -- Get already requested
  SELECT COALESCE(SUM(amount), 0) INTO v_available_balance
  FROM payout_requests
  WHERE venue_id = p_venue_id AND status IN ('requested', 'processing');
  
  IF p_amount < v_min_payout THEN
    RAISE EXCEPTION 'Minimum payout amount is %', v_min_payout;
  END IF;
  
  IF p_amount > v_available_balance THEN
    RAISE EXCEPTION 'Insufficient balance. Available: %', v_available_balance;
  END IF;
  
  -- Create payout request
  INSERT INTO payout_requests (
    venue_id, amount, bank_name, bank_account_number, bank_account_holder, status
  ) VALUES (
    p_venue_id, p_amount, p_bank_name, p_bank_account_number, p_bank_account_holder, 'requested'
  ) RETURNING id INTO v_request_id;
  
  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql;

-- Approve payout (admin function)
CREATE OR REPLACE FUNCTION approve_payout(
  p_payout_id UUID,
  p_admin_id UUID,
  p_transaction_ref TEXT
)
RETURNS void AS $$
BEGIN
  UPDATE payout_requests SET
    status = 'completed',
    reviewed_by = p_admin_id,
    transaction_reference = p_transaction_ref,
    completed_at = NOW(),
    processed_at = NOW()
  WHERE id = p_payout_id;
END;
$$ LANGUAGE plpgsql;

-- Generate platform report
CREATE OR REPLACE FUNCTION generate_platform_report(
  p_report_type VARCHAR,
  p_period_start DATE,
  p_period_end DATE
)
RETURNS UUID AS $$
DECLARE
  v_total_transactions INTEGER;
  v_total_gross NUMERIC(15,2);
  v_total_fee NUMERIC(15,2);
  v_total_payouts NUMERIC(15,2);
  v_total_pending NUMERIC(15,2);
  v_venue_data JSONB;
  v_report_id UUID;
BEGIN
  -- Aggregate metrics
  SELECT 
    COUNT(*),
    COALESCE(SUM(e.gross_amount), 0),
    COALESCE(SUM(e.platform_fee_amount), 0)
  INTO v_total_transactions, v_total_gross, v_total_fee
  FROM platform_earnings e
  JOIN invoices i ON i.id = e.invoice_id
  WHERE i.created_at >= p_period_start AND i.created_at <= p_period_end + INTERVAL '1 day';
  
  -- Payouts
  SELECT COALESCE(SUM(amount), 0) INTO v_total_payouts
  FROM payout_requests
  WHERE completed_at >= p_period_start AND completed_at <= p_period_end + INTERVAL '1 day';
  
  -- Pending
  SELECT COALESCE(SUM(net_to_venue), 0) INTO v_total_pending
  FROM platform_earnings
  WHERE status = 'pending';
  
  -- Venue breakdown
  SELECT jsonb_agg(jsonb_build_object(
    'venue_name', v.name,
    'total_revenue', COALESCE(SUM(e.gross_amount), 0),
    'total_fee', COALESCE(SUM(e.platform_fee_amount), 0)
  ))
  INTO v_venue_data
  FROM platform_earnings e
  JOIN venues v ON v.id = e.venue_id
  WHERE e.created_at >= p_period_start AND e.created_at <= p_period_end + INTERVAL '1 day'
  GROUP BY v.name;
  
  -- Create report
  INSERT INTO platform_reports (
    report_type, period_start, period_end,
    total_transactions, total_gross_amount, total_platform_fee,
    total_payouts, total_pending, venue_breakdown
  ) VALUES (
    p_report_type, p_period_start, p_period_end,
    v_total_transactions, v_total_gross, v_total_fee,
    v_total_payouts, v_total_pending, v_venue_data
  ) RETURNING id INTO v_report_id;
  
  RETURN v_report_id;
END;
$$ LANGUAGE plpgsql;
