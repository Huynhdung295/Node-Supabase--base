-- Migration: Add daily_commissions table for crawler system
-- File: 20251129200000_add_daily_commissions.sql
-- Description: Daily snapshot of commissions from exchanges (Bybit, etc.)

BEGIN;

-- Create daily_commissions table
CREATE TABLE IF NOT EXISTS public.daily_commissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    link_id UUID REFERENCES public.user_exchange_links(id) ON DELETE CASCADE,
    exchange_id INT REFERENCES public.exchanges(id) ON DELETE CASCADE,
    exchange_uid TEXT NOT NULL,
    
    -- Date and commission data
    date DATE NOT NULL,
    commissions DECIMAL DEFAULT 0,
    commissions_pending DECIMAL DEFAULT 0,
    trading_amount DECIMAL DEFAULT 0,
    
    -- Additional Bybit fields
    deposits DECIMAL DEFAULT 0,
    taker_amount DECIMAL DEFAULT 0,
    maker_amount DECIMAL DEFAULT 0,
    
    -- Metadata
    is_finalized BOOLEAN DEFAULT FALSE,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: 1 user per exchange per day
    UNIQUE(user_id, exchange_id, date)
);

-- Indexes for performance
CREATE INDEX idx_daily_commissions_date ON public.daily_commissions(date);
CREATE INDEX idx_daily_commissions_user ON public.daily_commissions(user_id);
CREATE INDEX idx_daily_commissions_finalized ON public.daily_commissions(is_finalized);
CREATE INDEX idx_daily_commissions_exchange_uid ON public.daily_commissions(exchange_uid);
CREATE INDEX idx_daily_commissions_link ON public.daily_commissions(link_id);

-- Trigger for updated_at
CREATE TRIGGER update_daily_commissions_modtime 
    BEFORE UPDATE ON public.daily_commissions 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS
ALTER TABLE public.daily_commissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view own commission data
CREATE POLICY "Users can view own daily commissions" 
    ON public.daily_commissions 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Policy: Service role can manage all
CREATE POLICY "Service role can manage daily commissions"
    ON public.daily_commissions
    FOR ALL
    USING (auth.role() = 'service_role');

COMMIT;
