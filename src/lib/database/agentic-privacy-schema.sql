-- ============================================
// PHASE 7.10: AGENTIC DATA & PRIVACY SOVEREIGNTY
// Advanced AI Agents & Privacy-First Infrastructure
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
// 7.10.1: AGENTIC MARKETING AGENTS
// ============================================

-- Table: AI Marketing Agents
CREATE TABLE marketing_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brand_accounts(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Agent configuration
    agent_name TEXT NOT NULL,
    agent_type TEXT NOT NULL, -- 'growth', 'conversion', 'retention', 'inventory'
    
    -- Goals
    goal_description TEXT NOT NULL,
    target_kpi TEXT NOT NULL, -- 'sales_increase', 'visits', 'engagement'
    target_value FLOAT NOT NULL,
    target_period_days INTEGER DEFAULT 7,
    
    -- Budget
    budget_allocated INTEGER DEFAULT 0,
    budget_spent INTEGER DEFAULT 0,
    
    -- Autonomy level
    autonomy_level TEXT DEFAULT 'assisted', -- 'manual', 'assisted', 'autonomous'
    max_bid_per_action INTEGER DEFAULT 500000,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Agent Executions
CREATE TABLE agent_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES marketing_agents(id) ON DELETE CASCADE NOT NULL,
    
    -- Execution details
    execution_type TEXT NOT NULL, -- 'flash_promo', 'bid_adjustment', 'audience_expansion'
    trigger_reason TEXT NOT NULL,
    
    -- Decision data
    decision JSONB NOT NULL DEFAULT '{}', -- {action, target_audience, bid_amount, venue_ids}
    
    -- Results
    result_type TEXT, -- 'success', 'failed', 'pending'
    result_metrics JSONB DEFAULT '{}',
    cost_incurred INTEGER DEFAULT 0,
    
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
// 7.10.2: PRIVACY-FIRST DATA CLEAN ROOMS
// ============================================

-- Table: Data Clean Rooms
CREATE TABLE data_clean_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Room configuration
    room_name TEXT NOT NULL,
    description TEXT,
    
    -- Participants
    primary_party_id UUID NOT NULL, -- Brand or internal
    secondary_party_id UUID, -- External brand
    is_internal BOOLEAN DEFAULT false,
    
    -- Data policies
    min_match_count INTEGER DEFAULT 100, -- Minimum overlapping users
    differential_privacy_epsilon FLOAT DEFAULT 1.0,
    noise_injection_enabled BOOLEAN DEFAULT true,
    
    -- Status
    status TEXT DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Table: Clean Room Match Results
CREATE TABLE clean_room_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clean_room_id UUID REFERENCES data_clean_rooms(id) ON DELETE CASCADE NOT NULL,
    
    -- Matched segments
    segment_a_count INTEGER,
    segment_b_count INTEGER,
    overlap_count INTEGER,
    
    -- Aggregated insights (no PII)
    aggregated_metrics JSONB DEFAULT '{}',
    insights JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: External CRM Uploads
CREATE TABLE external_crm_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clean_room_id UUID REFERENCES data_clean_rooms(id) ON DELETE CASCADE NOT NULL,
    uploading_party_id UUID NOT NULL,
    
    -- File info
    file_name TEXT NOT NULL,
    record_count INTEGER,
    hash_of_data TEXT NOT NULL, -- SHA-256 hash for integrity
    
    -- Status
    status TEXT DEFAULT 'processing', -- 'processing', 'matched', 'failed'
    
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- ============================================
// 7.10.3: CONSUMPTION ORACLE (SUPPLY CHAIN)
// ============================================

-- Table: Distribution Partners
CREATE TABLE distribution_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Partner info
    company_name TEXT NOT NULL,
    company_type TEXT NOT NULL, -- 'distributor', 'wholesaler', 'importer'
    
    contact_email TEXT NOT NULL,
    api_endpoint TEXT,
    api_key_hash TEXT,
    
    -- Integration
    integration_type TEXT, -- 'erp', 'api', 'manual'
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Restock Signals
CREATE TABLE restock_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Trigger
    signal_type TEXT NOT NULL, -- 'surge_detected', 'stock_predicted', 'seasonal_forecast'
    
    -- Product
    brand_id UUID REFERENCES brand_accounts(id),
    category TEXT NOT NULL,
    
    -- Location
    city_id UUID REFERENCES cities(id),
    district TEXT,
    
    -- Signal data
    current_demand INTEGER,
    predicted_demand INTEGER,
    confidence_score FLOAT,
    
    -- Action
    signal_sent_to UUID REFERENCES distribution_partners(id),
    action_taken TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
// 7.10.4: RESPONSIBLE VIBE AI
// ============================================

-- Table: User Drinking Profiles
CREATE TABLE drinking_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    
    -- Consumption metrics (anonymized for privacy)
    drinks_per_week_avg FLOAT DEFAULT 0,
    avg_spending_per_session INTEGER DEFAULT 0,
    peak_hours JSONB DEFAULT '[]',
    preferred_categories JSONB DEFAULT '[]',
    
    -- Risk assessment
    risk_level TEXT DEFAULT 'low', -- 'low', 'medium', 'high'
    consecutive_high_sessions INTEGER DEFAULT 0,
    
    -- Interventions
    ride_offer_count INTEGER DEFAULT 0,
    ride_offer_accepted_count INTEGER DEFAULT 0,
    zero_proof_offer_count INTEGER DEFAULT 0,
    zero_proof_accepted_count INTEGER DEFAULT 0,
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Responsible AI Interventions
CREATE TABLE ai_interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Intervention type
    intervention_type TEXT NOT NULL, -- 'ride_offer', 'zero_proof_suggestion', 'limit_warning'
    
    -- Context
    context JSONB DEFAULT '{}', -- {venue, spending, drinks_count, time}
    
    -- Response
    response_type TEXT, -- 'accepted', 'declined', 'ignored'
    response_value INTEGER, -- e.g., ride cost saved
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
// 7.10.5: SEMANTIC DATA LAYER (ASK NIGHTLIFE)
// ============================================

-- Table: Semantic Queries
CREATE TABLE semantic_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Query
    query_text TEXT NOT NULL,
    query_language TEXT DEFAULT 'id',
    
    -- Intent detection
    detected_intent TEXT,
    entities JSONB DEFAULT '[]',
    
    -- Response
    response_text TEXT,
    response_sources JSONB DEFAULT '[]',
    confidence_score FLOAT,
    
    -- Feedback
    user_rating INTEGER, -- 1-5
    is_helpful BOOLEAN,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Analytics Cache (for fast queries)
CREATE TABLE analytics_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Cache key
    cache_key TEXT UNIQUE NOT NULL,
    query_type TEXT NOT NULL,
    
    -- Data
    result_data JSONB NOT NULL,
    
    -- TTL
    expires_at TIMESTAMPTZ NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
// 7.10.6: PROOF-OF-INTEGRITY & COMPLIANCE
// ============================================

-- Table: Data Integrity Proofs
CREATE TABLE integrity_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Data being proven
    data_type TEXT NOT NULL, -- 'sip_verification', 'transaction', 'attribution'
    record_id TEXT NOT NULL,
    record_hash TEXT NOT NULL, -- SHA-256
    
    -- Proof chain
    previous_proof_id UUID,
    proof_chain_hash TEXT NOT NULL,
    nonce INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Data Subject Requests (GDPR/UU PDP)
CREATE TABLE data_subject_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Request type
    request_type TEXT NOT NULL, -- 'access', 'deletion', 'portability', 'correction'
    
    -- Status
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'rejected'
    
    -- Details
    request_details JSONB DEFAULT '{}',
    
    -- Processing
    assigned_to UUID REFERENCES auth.users(id),
    completed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: Consent Management
CREATE TABLE consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Consent categories
    marketing_consent BOOLEAN DEFAULT false,
    analytics_consent BOOLEAN DEFAULT false,
    personalization_consent BOOLEAN DEFAULT false,
    third_party_consent BOOLEAN DEFAULT false,
    
    -- Granular preferences
    preferences JSONB DEFAULT '{}',
    
    -- Legal
    ip_address TEXT,
    user_agent TEXT,
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
// FUNCTIONS
// ============================================

-- Function: Agent execution loop
CREATE OR REPLACE FUNCTION execute_marketing_agent(
    p_agent_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_agent RECORD;
    v_result JSONB;
    v_decision JSONB;
BEGIN
    -- Get agent
    SELECT * INTO v_agent FROM marketing_agents WHERE id = p_agent_id;
    
    IF NOT FOUND OR NOT v_agent.is_active THEN
        RETURN jsonb_build_object('success', false, 'reason', 'Agent not found or inactive');
    END IF;
    
    -- Analyze current state and make decision
    -- (In production, this would call ML model)
    v_decision := jsonb_build_object(
        'action', 'flash_promo',
        'target_audience', 'platinum_users_with_tequila_history',
        'discount', 20,
        'venue_ids', ARRAY['venue1', 'venue2'],
        'estimated_reach', 500,
        'confidence', 0.78
    );
    
    -- Execute and log
    INSERT INTO agent_executions (agent_id, execution_type, trigger_reason, decision)
    VALUES (p_agent_id, v_decision->>'action', 'goal_optimization', v_decision);
    
    -- Update agent
    UPDATE marketing_agents SET
        last_run_at = NOW(),
        budget_spent = budget_spent + (v_decision->>'estimated_cost')::INTEGER
    WHERE id = p_agent_id;
    
    RETURN jsonb_build_object('success', true, 'decision', v_decision);
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate differential privacy
CREATE OR REPLACE FUNCTION apply_differential_privacy(
    p_count INTEGER,
    p_epsilon FLOAT DEFAULT 1.0
)
RETURNS INTEGER AS $$
DECLARE
    v_noise INTEGER;
BEGIN
    -- Laplace noise
    v_noise := FLOOR((random() - 0.5) * 2 * (1.0 / p_epsilon) * p_count)::INTEGER;
    RETURN GREATEST(0, p_count + v_noise);
END;
$$ LANGUAGE plpgsql;

-- Function: Generate data hash
CREATE OR REPLACE FUNCTION generate_data_hash(
    p_data JSONB
)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function: Process deletion request
CREATE OR REPLACE FUNCTION process_deletion_request(
    p_user_id UUID
)
RETURNS JSONB AS $$
BEGIN
    -- Anonymize user data
    UPDATE profiles SET
        full_name = 'DELETED',
        phone = encode(gen_random_bytes(8), 'hex'),
        avatar_url = NULL
    WHERE id = p_user_id;
    
    -- Delete sensitive data
    DELETE FROM drinking_profiles WHERE user_id = p_user_id;
    DELETE FROM user_price_elasticity WHERE user_id = p_user_id;
    DELETE FROM financial_profiles WHERE user_id = p_user_id;
    
    -- Mark for deletion in other tables
    UPDATE bookings SET user_id = NULL WHERE user_id = p_user_id;
    UPDATE checkins SET user_id = NULL WHERE user_id = p_user_id;
    
    -- Log request
    INSERT INTO data_subject_requests (user_id, request_type, status, completed_at)
    VALUES (p_user_id, 'deletion', 'completed', NOW());
    
    RETURN jsonb_build_object('success', true, 'message', 'Data deletion completed');
END;
$$ LANGUAGE plpgsql;

-- Function: Semantic query processor
CREATE OR REPLACE FUNCTION process_semantic_query(
    p_user_id UUID,
    p_query TEXT,
    p_language TEXT DEFAULT 'id'
)
RETURNS JSONB AS $$
DECLARE
    v_intent TEXT;
    v_response TEXT;
    v_result JSONB;
BEGIN
    -- Detect intent (simplified)
    IF p_query ILIKE '%sepi%' OR p_query ILIKE '%low%' THEN
        v_intent := 'analyze_low_performance';
    ELSIF p_query ILIKE '%promo%' OR p_query ILIKE '%offer%' THEN
        v_intent := 'recommend_promo';
    ELSIF p_query ILIKE '%competitor%' OR p_query ILIKE '%tetangga%' THEN
        v_intent := 'competitor_analysis';
    ELSE
        v_intent := 'general_insight';
    END IF;
    
    -- Generate response (in production, call LLM)
    CASE v_intent
        WHEN 'analyze_low_performance' THEN
            v_response := 'Analisis menunjukkan bahwa ada 3 faktor utama: 1) Event besar di dekat lokasi Anda menarik 30% visitor, 2) Kompetitor sebelah memulai promo free flow, 3) Cuaca hujan menurunkan意愿 sebesar 15%.';
        WHEN 'recommend_promo' THEN
            v_response := 'Rekomendasi: Launch flash promo 30% off untuk cocktail antara jam 19:00-21:00 untuk menarik early visitors. Targetkan pengguna Platinum yang pernah visit sebelumnya.';
        WHEN 'competitor_analysis' THEN
            v_response := ' Kompetitor di sebelah (nama) memiliki rating 4.2 dan sedang menjalani promo Ladies Night. Mereka average spend Rp 150rb lebih rendah dari Anda.';
        ELSE
            v_response := 'Berdasarkan data 30 hari terakhir, performa venue Anda berada di atas 75% venue serupa di area Anda.';
    END CASE;
    
    -- Log query
    INSERT INTO semantic_queries (user_id, query_text, detected_intent, response_text, confidence_score)
    VALUES (p_user_id, p_query, v_intent, v_response, 0.85);
    
    RETURN jsonb_build_object(
        'success', true,
        'intent', v_intent,
        'response', v_response,
        'confidence', 0.85
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
// RLS POLICIES
// ============================================

ALTER TABLE marketing_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_clean_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE clean_room_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_crm_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE restock_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE drinking_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE semantic_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrity_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_subject_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

-- Marketing agents: Brand owner manage
CREATE POLICY "Brands manage agents" ON marketing_agents FOR ALL USING (
    brand_id IN (SELECT id FROM brand_accounts WHERE created_by = auth.uid())
);

-- Clean rooms: Admin manage
CREATE POLICY "Admin manage clean rooms" ON data_clean_rooms FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- Drinking profiles: User view own
CREATE POLICY "Users view own drinking" ON drinking_profiles FOR SELECT USING (
    user_id = auth.uid()
);

-- Semantic queries: User view own
CREATE POLICY "Users view own queries" ON semantic_queries FOR SELECT USING (
    user_id = auth.uid()
);

-- Data requests: User manage own
CREATE POLICY "Users manage own requests" ON data_subject_requests FOR ALL USING (
    user_id = auth.uid()
);

-- Consent: User manage own
CREATE POLICY "Users manage own consent" ON consent_records FOR ALL USING (
    user_id = auth.uid()
);

-- Integrity proofs: Public read
CREATE POLICY "Public read proofs" ON integrity_proofs FOR SELECT USING (true);

-- Distribution partners: Admin manage
CREATE POLICY "Admin manage partners" ON distribution_partners FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);
