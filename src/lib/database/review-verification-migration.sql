-- =====================================================
-- REVIEW VERIFICATION ENGINE MIGRATION
-- Run this migration against your PostgreSQL database (Supabase)
-- 
-- Execute these commands in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- VIBE_CHECK TABLE UPDATES
-- =====================================================

-- Add GPS status field
ALTER TABLE vibe_checks ADD COLUMN IF NOT EXISTS gps_status VARCHAR(20) DEFAULT 'PENDING';
-- Values: MATCH, MISMATCH, PENDING

-- Add elite verification (receipt + GPS)
ALTER TABLE vibe_checks ADD COLUMN IF NOT EXISTS is_elite_verified BOOLEAN DEFAULT false;

-- Add social interaction counters
ALTER TABLE vibe_checks ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE vibe_checks ADD COLUMN IF NOT EXISTS reports_count INTEGER DEFAULT 0;
ALTER TABLE vibe_checks ADD COLUMN IF NOT EXISTS is_flagged_for_review BOOLEAN DEFAULT false;

-- =====================================================
-- VENUE TABLE UPDATES
-- =====================================================

-- Add rating aggregates
ALTER TABLE venues ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,1) DEFAULT 0.0;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- =====================================================
-- NEW TABLES: SOCIAL INTERACTIONS
-- =====================================================

-- Create review_likes table
CREATE TABLE IF NOT EXISTS review_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES vibe_checks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(review_id, user_id)
);

-- Create review_reports table
CREATE TABLE IF NOT EXISTS review_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES vibe_checks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    reason VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Review likes indexes
CREATE INDEX IF NOT EXISTS idx_review_likes_review_id ON review_likes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_likes_user_id ON review_likes(user_id);

-- Review reports indexes
CREATE INDEX IF NOT EXISTS idx_review_reports_review_id ON review_reports(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_user_id ON review_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_status ON review_reports(status);

-- Vibe checks indexes
CREATE INDEX IF NOT EXISTS idx_vibe_checks_gps_status ON vibe_checks(gps_status);
CREATE INDEX IF NOT EXISTS idx_vibe_checks_is_elite_verified ON vibe_checks(is_elite_verified);
CREATE INDEX IF NOT EXISTS idx_vibe_checks_is_flagged ON vibe_checks(is_flagged_for_review);

-- Venue indexes
CREATE INDEX IF NOT EXISTS idx_venues_average_rating ON venues(average_rating);

-- =====================================================
-- DATABASE TRIGGER FOR AUTO RATING UPDATE
-- (Run this as separate SQL after table creation)
-- =====================================================

-- Function to update venue rating when review is approved
CREATE OR REPLACE FUNCTION update_venue_rating_on_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_approved = true AND OLD.is_approved = false THEN
        UPDATE venues 
        SET 
            average_rating = (
                SELECT ROUND(AVG(rating)::numeric, 1) 
                FROM vibe_checks 
                WHERE venue_id = NEW.venue_id AND is_approved = true
            ),
            total_reviews = (
                SELECT COUNT(*) 
                FROM vibe_checks 
                WHERE venue_id = NEW.venue_id AND is_approved = true
            ),
            trust_score = LEAST(100, GREATEST(0, (
                SELECT ROUND(AVG(rating)::numeric, 1) * 20 
                FROM vibe_checks 
                WHERE venue_id = NEW.venue_id AND is_approved = true
            )))
        WHERE id = NEW.venue_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS vibe_check_approval_trigger ON vibe_checks;
CREATE TRIGGER vibe_check_approval_trigger
    AFTER UPDATE ON vibe_checks
    FOR EACH ROW
    EXECUTE FUNCTION update_venue_rating_on_approval();

-- =====================================================
-- TRIGGER FOR AUTO-FLAGGING HIGH REPORTS
-- =====================================================

CREATE OR REPLACE FUNCTION auto_flag_review_on_reports()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reports_count >= 5 AND OLD.reports_count < 5 THEN
        UPDATE vibe_checks 
        SET is_flagged_for_review = true 
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS review_reports_count_trigger ON vibe_checks;
CREATE TRIGGER review_reports_count_trigger
    AFTER UPDATE OF reports_count ON vibe_checks
    FOR EACH ROW
    EXECUTE FUNCTION auto_flag_review_on_reports();

-- =====================================================
-- GRANT PERMISSIONS (if needed)
-- =====================================================

-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
