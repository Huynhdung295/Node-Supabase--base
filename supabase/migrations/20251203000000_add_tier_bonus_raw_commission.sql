-- Migration: Add Tier Bonus and Raw Commission Tracking
-- Date: 2025-12-03

-- 1. Add tier bonus columns to claim_requests
ALTER TABLE claim_requests
ADD COLUMN IF NOT EXISTS tier_id INTEGER REFERENCES tiers(id),
ADD COLUMN IF NOT EXISTS tier_bonus_percentage DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS bonus_amount DECIMAL(20,8) DEFAULT 0;

COMMENT ON COLUMN claim_requests.tier_id IS 'Tier of user at time of claim creation';
COMMENT ON COLUMN claim_requests.tier_bonus_percentage IS 'Tier bonus percentage applied (e.g., 15.00 for 15%)';
COMMENT ON COLUMN claim_requests.bonus_amount IS 'Calculated bonus amount (display only, not deducted from balance)';

-- 2. Add raw commission tracking to daily_commissions
-- This stores the original commission amount before custom rate is applied
ALTER TABLE daily_commissions
ADD COLUMN IF NOT EXISTS raw_commissions DECIMAL(20,8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS raw_commissions_pending DECIMAL(20,8) DEFAULT 0;

COMMENT ON COLUMN daily_commissions.raw_commissions IS 'Original commission amount from exchange (before custom rate)';
COMMENT ON COLUMN daily_commissions.raw_commissions_pending IS 'Original pending commission amount (before custom rate)';
COMMENT ON COLUMN daily_commissions.commissions IS 'Commission available to user after custom rate applied';
COMMENT ON COLUMN daily_commissions.commissions_pending IS 'Pending commission after custom rate applied';

-- 3. Add index for tier_id lookup
CREATE INDEX IF NOT EXISTS idx_claim_requests_tier_id ON claim_requests(tier_id);
