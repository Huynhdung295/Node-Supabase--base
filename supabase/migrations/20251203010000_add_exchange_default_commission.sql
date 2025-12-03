-- Migration: Add default commission rate to exchanges and fix commission logic
-- Date: 2025-12-03

-- Add default_commission_rate to exchanges table
ALTER TABLE exchanges
ADD COLUMN IF NOT EXISTS default_commission_rate DECIMAL(5,2) DEFAULT 0.20;

COMMENT ON COLUMN exchanges.default_commission_rate IS 'Default commission rate for this exchange (e.g., 0.20 for 20%)';

-- Update existing exchanges to have 20% default
UPDATE exchanges SET default_commission_rate = 0.20 WHERE default_commission_rate IS NULL;

-- Remove custom_commission_rate from user_exchange_links (no longer used)
-- Keeping it for now as it might have data, but we won't use it in logic
COMMENT ON COLUMN user_exchange_links.custom_commission_rate IS 'DEPRECATED - Use exchange default_commission_rate + tier rate instead';
