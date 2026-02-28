-- =====================================================
-- SHADOW BAN & REVIEW MODERATION MIGRATION
-- Run this migration against your PostgreSQL database (Supabase)
-- 
-- Execute these commands in Supabase SQL Editor
-- =====================================================

-- Add is_shadow_banned to users table
ALTER TABLE users ADD COLUMN is_shadow_banned BOOLEAN DEFAULT false;

-- Add moderation fields to vibe_checks table  
ALTER TABLE vibe_checks ADD COLUMN is_approved BOOLEAN DEFAULT false;
ALTER TABLE vibe_checks ADD COLUMN rejection_reason_code VARCHAR(50);
ALTER TABLE vibe_checks ADD COLUMN rejection_reason TEXT;
ALTER TABLE vibe_checks ADD COLUMN reviewed_by VARCHAR(255);
ALTER TABLE vibe_checks ADD COLUMN reviewed_at TIMESTAMP;

-- Create indexes for better query performance
CREATE INDEX idx_users_shadow_banned ON users(is_shadow_banned);
CREATE INDEX idx_vibe_checks_approved ON vibe_checks(is_approved);
CREATE INDEX idx_vibe_checks_reviewed_at ON vibe_checks(reviewed_at);

-- =====================================================
-- MODERATION REASON CODES (Application Constants)
-- FAKE_REVIEW         - Review appears to be fake/fabricated
-- INAPPROPRIATE       - Contains inappropriate content
-- SPAM                - Appears to be spam
-- POLICY_VIOLATION    - Violates content policy
-- SELF_PROMOTION      - Contains self-promotional content
-- COMPETITOR_ATTACK   - Appears to be competitor attack
-- =====================================================
