-- Migration: Allow user_id nullable and change unique constraint
-- This allows saving commission data for unlinked UIDs

-- 1. Drop old unique constraint
ALTER TABLE daily_commissions 
DROP CONSTRAINT IF EXISTS daily_commissions_user_id_exchange_id_date_key;

-- 2. Make user_id and link_id nullable (allow unlinked UIDs)
ALTER TABLE daily_commissions 
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE daily_commissions 
ALTER COLUMN link_id DROP NOT NULL;

-- 3. Add new unique constraint based on exchange_uid instead of user_id
-- This prevents duplicate entries for same UID on same date
ALTER TABLE daily_commissions 
ADD CONSTRAINT daily_commissions_exchange_uid_exchange_id_date_key 
UNIQUE (exchange_uid, exchange_id, date);

-- 4. Add index for querying unlinked UIDs
CREATE INDEX IF NOT EXISTS idx_daily_commissions_unlinked 
ON daily_commissions(exchange_id, date) 
WHERE user_id IS NULL;

-- 5. Add index for exchange_uid lookups
CREATE INDEX IF NOT EXISTS idx_daily_commissions_exchange_uid_lookup 
ON daily_commissions(exchange_uid, exchange_id);
