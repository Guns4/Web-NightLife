-- =====================================================
-- FINANCIAL DATABASE SCHEMA - PHASE 3.3
-- Digital Invoice & E-Receipt System
-- =====================================================

-- =====================================================
-- 1. INVOICES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  
  -- Invoice Details
  invoice_type VARCHAR(20) NOT NULL DEFAULT 'receipt', -- 'invoice' (B2B) or 'receipt' (B2C)
  guest_name VARCHAR(255),
  guest_email VARCHAR(255),
  guest_phone VARCHAR(20),
  
  -- Financial
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'unpaid', -- 'unpaid', 'paid', 'cancelled', 'refunded'
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  
  -- Payment
  payment_method VARCHAR(50),
  payment_reference TEXT, -- Transaction ID from payment gateway
  
  -- Items (JSONB array)
  item_details JSONB DEFAULT '[]'::jsonb,
  
  -- QR Code for verification
  verification_code TEXT UNIQUE NOT NULL,
  verification_url TEXT,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. TRANSACTION LOGS (AUDIT TRAIL)
-- =====================================================

CREATE TABLE IF NOT EXISTS transaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'created', 'paid', 'cancelled', 'refunded', 'viewed', 'shared'
  performed_by UUID REFERENCES profiles(id),
  performed_by_email VARCHAR(255),
  previous_status VARCHAR(20),
  new_status VARCHAR(20),
  amount NUMERIC(15,2),
  notes TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. SUBSCRIPTIONS (For B2B - Platform to Venue)
-- =====================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  
  -- Plan Details
  plan_name VARCHAR(100) NOT NULL, -- 'starter', 'professional', 'enterprise'
  plan_price NUMERIC(15,2) NOT NULL,
  billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly', -- 'monthly', 'yearly'
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'expired', 'past_due'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  
  -- Features
  features JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. PAYMENT METHODS (Stored for guests)
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  venue_id UUID REFERENCES venues(id),
  
  type VARCHAR(50) NOT NULL, -- 'credit_card', 'debit_card', 'e_wallet', 'bank_transfer'
  provider VARCHAR(50), -- 'bca', 'mandiri', 'gojek', 'dana', 'ovo'
  last_four VARCHAR(4),
  expiry_month INTEGER,
  expiry_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  
  -- Encrypted sensitive data (for cards)
  tokenized_data TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. REFUNDS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  amount NUMERIC(15,2) NOT NULL,
  reason TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'processed'
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_invoices_venue ON invoices(venue_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_invoice ON transaction_logs(invoice_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_user ON transaction_logs(performed_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_venue ON subscriptions(venue_id, status);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

-- Guests can view their own invoices
CREATE POLICY "Guests can view own invoices" ON invoices FOR SELECT
  USING (user_id = auth.uid() OR venue_id IN (
    SELECT venue_id FROM staff_invitations WHERE user_id = auth.uid() AND status = 'accepted'
  ));

-- Staff can view venue invoices
CREATE POLICY "Staff can view venue invoices" ON invoices FOR SELECT
  USING (venue_id IN (
    SELECT venue_id FROM staff_invitations WHERE user_id = auth.uid() AND status = 'accepted'
  ));

-- Only owners and admins can modify
CREATE POLICY "Owners can manage invoices" ON invoices FOR ALL
  USING (venue_id IN (
    SELECT v.id FROM venues v 
    LEFT JOIN staff_invitations si ON si.venue_id = v.id AND si.user_id = auth.uid() AND si.status = 'accepted'
    WHERE v.owner_id = auth.uid() OR si.role IN ('owner', 'manager')
  ));

-- Transaction logs are view-only for audit
CREATE POLICY "Audit logs viewable" ON transaction_logs FOR SELECT
  USING (invoice_id IN (
    SELECT id FROM invoices WHERE venue_id IN (
      SELECT venue_id FROM staff_invitations WHERE user_id = auth.uid() AND status = 'accepted'
    )
  ));

-- Payment methods - user can manage their own
CREATE POLICY "Users manage own payment methods" ON payment_methods FOR ALL
  USING (user_id = auth.uid());

-- Subscriptions - venue owners only
CREATE POLICY "Owners manage subscriptions" ON subscriptions FOR ALL
  USING (venue_id IN (
    SELECT id FROM venues WHERE owner_id = auth.uid()
  ));

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Generate unique invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number(venue_code TEXT)
RETURNS TEXT AS $$
DECLARE
  invoice_num TEXT;
  today TEXT;
  seq_num INTEGER;
BEGIN
  today := TO_CHAR(NOW(), 'YYYYMMDD');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 15 FOR 4) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM invoices
  WHERE invoice_number LIKE 'INV/' || today || '/' || venue_code || '/%';
  
  invoice_num := 'INV/' || today || '/' || UPPER(venue_code) || '/' || LPAD(seq_num::TEXT, 4, '0');
  
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Generate verification code for QR
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
BEGIN
  code := ENCODE(RANDOM_BYTES(16), 'hex');
  RETURN UPPER(code);
END;
$$ LANGUAGE plpgsql;

-- Log invoice status change
CREATE OR REPLACE FUNCTION log_invoice_status_change(
  p_invoice_id UUID,
  p_action VARCHAR,
  p_performed_by UUID,
  p_new_status VARCHAR,
  p_amount NUMERIC,
  p_notes TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_previous_status VARCHAR(20);
  v_email TEXT;
BEGIN
  -- Get previous status
  SELECT status INTO v_previous_status FROM invoices WHERE id = p_invoice_id;
  
  -- Get user email
  SELECT email INTO v_email FROM profiles WHERE id = p_performed_by;
  
  -- Insert log
  INSERT INTO transaction_logs (
    invoice_id, action, performed_by, performed_by_email,
    previous_status, new_status, amount, notes
  ) VALUES (
    p_invoice_id, p_action, p_performed_by, v_email,
    v_previous_status, p_new_status, p_amount, p_notes
  );
END;
$$ LANGUAGE plpgsql;

-- Auto-update invoice status
CREATE OR REPLACE FUNCTION update_invoice_status(
  p_invoice_id UUID,
  p_new_status VARCHAR,
  p_payment_method TEXT DEFAULT NULL,
  p_payment_reference TEXT DEFAULT NULL,
  p_performed_by UUID DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_current_status VARCHAR(20);
  v_amount NUMERIC(15,2);
BEGIN
  -- Get current status and amount
  SELECT status, total_amount INTO v_current_status, v_amount
  FROM invoices WHERE id = p_invoice_id;
  
  -- Don't allow changes from paid/cancelled
  IF v_current_status IN ('paid', 'cancelled', 'refunded') THEN
    RAISE EXCEPTION 'Cannot modify invoice in status: %', v_current_status;
  END IF;
  
  -- Update invoice
  UPDATE invoices SET
    status = p_new_status,
    payment_method = COALESCE(p_payment_method, payment_method),
    payment_reference = COALESCE(p_payment_reference, payment_reference),
    paid_at = CASE WHEN p_new_status = 'paid' THEN NOW() ELSE paid_at END,
    updated_at = NOW()
  WHERE id = p_invoice_id;
  
  -- Log the change
  IF p_performed_by IS NOT NULL THEN
    PERFORM log_invoice_status_change(
      p_invoice_id,
      CASE p_new_status WHEN 'paid' THEN 'paid' WHEN 'cancelled' THEN 'cancelled' ELSE 'updated' END,
      p_performed_by,
      p_new_status,
      v_amount,
      'Status changed from ' || v_current_status || ' to ' || p_new_status
    );
  END IF;
END;
$$ LANGUAGE plpgsql;
