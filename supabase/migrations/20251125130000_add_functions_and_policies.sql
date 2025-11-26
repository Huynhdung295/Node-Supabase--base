-- Additional functions and policies for the API system

BEGIN;

-- ==================================================================
-- SECTION 1: UTILITY FUNCTIONS
-- ==================================================================

-- Function to calculate user balance (commission - approved claims)
CREATE OR REPLACE FUNCTION get_user_balance(user_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    total_commission DECIMAL DEFAULT 0;
    total_claims DECIMAL DEFAULT 0;
BEGIN
    -- Calculate total commission
    SELECT COALESCE(SUM(commission_amount), 0) INTO total_commission
    FROM transactions 
    WHERE user_id = user_uuid;
    
    -- Calculate total approved claims
    SELECT COALESCE(SUM(amount), 0) INTO total_claims
    FROM claim_requests 
    WHERE user_id = user_uuid AND status = 'approved';
    
    RETURN total_commission - total_claims;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate unique ref code
CREATE OR REPLACE FUNCTION generate_ref_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate 8 character alphanumeric code
        new_code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM profiles WHERE ref_code = new_code) INTO code_exists;
        
        -- Exit loop if code is unique
        IF NOT code_exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-update user tier based on volume
CREATE OR REPLACE FUNCTION update_user_tier(user_uuid UUID, exchange_id_param INT)
RETURNS VOID AS $$
DECLARE
    total_vol DECIMAL;
    new_tier_id INT;
BEGIN
    -- Get total volume for this user on this exchange
    SELECT COALESCE(SUM(total_volume), 0) INTO total_vol
    FROM user_exchange_links 
    WHERE user_id = user_uuid AND exchange_id = exchange_id_param;
    
    -- Find highest tier this user qualifies for
    SELECT tier_id INTO new_tier_id
    FROM exchange_tier_configs 
    WHERE exchange_id = exchange_id_param 
      AND required_points <= total_vol 
      AND is_active = true
    ORDER BY required_points DESC 
    LIMIT 1;
    
    -- Update user's tier if found
    IF new_tier_id IS NOT NULL THEN
        UPDATE profiles 
        SET current_tier_id = new_tier_id, updated_at = NOW()
        WHERE id = user_uuid;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================================
-- SECTION 2: ENHANCED POLICIES
-- ==================================================================

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own links" ON public.user_exchange_links;
DROP POLICY IF EXISTS "Users can view own txns" ON public.transactions;
DROP POLICY IF EXISTS "Users can view own claims" ON public.claim_requests;

-- Profiles policies
CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'cs'))
);

CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "profiles_insert_policy" ON public.profiles FOR INSERT WITH CHECK (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- User exchange links policies
CREATE POLICY "links_select_policy" ON public.user_exchange_links FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'cs'))
);

CREATE POLICY "links_insert_policy" ON public.user_exchange_links FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'cs'))
);

CREATE POLICY "links_update_policy" ON public.user_exchange_links FOR UPDATE USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'cs'))
);

-- Transactions policies
CREATE POLICY "transactions_select_policy" ON public.transactions FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'cs'))
);

CREATE POLICY "transactions_insert_policy" ON public.transactions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'system'))
);

-- Claim requests policies
CREATE POLICY "claims_select_policy" ON public.claim_requests FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'cs'))
);

CREATE POLICY "claims_insert_policy" ON public.claim_requests FOR INSERT WITH CHECK (
    auth.uid() = user_id
);

CREATE POLICY "claims_update_policy" ON public.claim_requests FOR UPDATE USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'cs'))
);

-- Public tables (no RLS needed)
ALTER TABLE public.tiers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchanges DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_tier_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.crawler_tokens DISABLE ROW LEVEL SECURITY;

-- ==================================================================
-- SECTION 3: INITIAL DATA
-- ==================================================================

-- Insert default tiers
INSERT INTO public.tiers (name, slug, priority, color_hex) VALUES
('Bronze', 'bronze', 1, '#CD7F32'),
('Silver', 'silver', 2, '#C0C0C0'),
('Gold', 'gold', 3, '#FFD700'),
('Platinum', 'platinum', 4, '#E5E4E2'),
('Diamond', 'diamond', 5, '#B9F2FF')
ON CONFLICT (slug) DO NOTHING;

-- Insert system settings
INSERT INTO public.system_settings (key, value, description) VALUES
('user_editable_fields', '["full_name", "phone", "dob", "gender", "location"]', 'Fields that users can edit in their profile'),
('maintenance_mode', 'false', 'System maintenance mode'),
('min_claim_amount', '10', 'Minimum amount for withdrawal claims'),
('max_claim_amount', '10000', 'Maximum amount for withdrawal claims'),
('email_verification_required', 'true', 'Require email verification for new users')
ON CONFLICT (key) DO NOTHING;

COMMIT;