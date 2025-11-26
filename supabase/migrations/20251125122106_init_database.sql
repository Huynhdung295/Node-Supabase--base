/* 
   FILE: 00_init_schema_full.sql
   DESCRIPTION: Full database schema initialization.
   FIXED: Removed explicit DROP TRIGGER on non-existent tables. 
          DROP TABLE CASCADE handles trigger cleanup automatically.
*/

BEGIN;

-- ==================================================================
-- SECTION 1: CLEANUP (RESET DATABASE)
-- ==================================================================

-- 1. Drop Triggers on AUTH schema (Since we don't drop auth.users table)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop Functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- 3. Drop Tables (CASCADE will automatically remove related Triggers and Foreign Keys)
DROP TABLE IF EXISTS public.claim_requests CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.crawler_tokens CASCADE;
DROP TABLE IF EXISTS public.user_exchange_links CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.system_settings CASCADE;
DROP TABLE IF EXISTS public.exchange_tier_configs CASCADE;
DROP TABLE IF EXISTS public.exchanges CASCADE;
DROP TABLE IF EXISTS public.tiers CASCADE;

-- 4. Drop Enums
DROP TYPE IF EXISTS app_role CASCADE;
DROP TYPE IF EXISTS app_status CASCADE;
DROP TYPE IF EXISTS link_status CASCADE;
DROP TYPE IF EXISTS claim_status CASCADE;

-- ==================================================================
-- SECTION 2: ENUMS & UTILITY FUNCTIONS
-- ==================================================================

CREATE TYPE app_role AS ENUM ('system', 'admin', 'cs', 'user', 'guest');
CREATE TYPE app_status AS ENUM ('active', 'inactive', 'maintenance', 'banned');
CREATE TYPE link_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE claim_status AS ENUM ('pending', 'wait_email_confirm', 'approved', 'rejected');

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- ==================================================================
-- SECTION 3: TABLE DEFINITIONS
-- ==================================================================

-- 1. Tiers
CREATE TABLE public.tiers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    priority INT DEFAULT 0,
    color_hex TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Exchanges
CREATE TABLE public.exchanges (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    status app_status DEFAULT 'active',
    logo_url TEXT,
    config_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Exchange Tier Configs
CREATE TABLE public.exchange_tier_configs (
    id SERIAL PRIMARY KEY,
    exchange_id INT REFERENCES public.exchanges(id) ON DELETE CASCADE,
    tier_id INT REFERENCES public.tiers(id) ON DELETE CASCADE,
    required_points DECIMAL DEFAULT 0,
    default_commission_rate DECIMAL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(exchange_id, tier_id)
);

-- 4. System Settings
CREATE TABLE public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Profiles
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    role app_role DEFAULT 'user',
    ref_code TEXT UNIQUE,
    referrer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    current_tier_id INT REFERENCES public.tiers(id) ON DELETE SET NULL,
    full_name TEXT,
    phone TEXT,
    dob DATE,
    gender TEXT,
    avatar_url TEXT,
    location JSONB,
    status app_status DEFAULT 'active',
    is_email_verified BOOLEAN DEFAULT FALSE,
    last_sign_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. User Exchange Links
CREATE TABLE public.user_exchange_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    exchange_id INT REFERENCES public.exchanges(id) ON DELETE CASCADE,
    exchange_uid TEXT NOT NULL,
    exchange_email TEXT,
    status link_status DEFAULT 'pending',
    custom_commission_rate DECIMAL,
    total_volume DECIMAL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, exchange_id, exchange_uid)
);

-- 7. Crawler Tokens
CREATE TABLE public.crawler_tokens (
    id SERIAL PRIMARY KEY,
    exchange_id INT REFERENCES public.exchanges(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    status app_status DEFAULT 'active',
    last_used_at TIMESTAMPTZ,
    expired_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Transactions
CREATE TABLE public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    link_id UUID REFERENCES public.user_exchange_links(id) ON DELETE SET NULL,
    exchange_id INT,
    raw_volume DECIMAL NOT NULL,
    commission_amount DECIMAL NOT NULL,
    rate_snapshot DECIMAL,
    transaction_date TIMESTAMPTZ,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Claim Requests
CREATE TABLE public.claim_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL NOT NULL,
    status claim_status DEFAULT 'pending',
    verification_code TEXT,
    cs_note TEXT,
    proof_img_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================================================================
-- SECTION 4: INDEXES, TRIGGERS & RLS
-- ==================================================================

-- Indexes
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_ref_code ON public.profiles(ref_code);
CREATE INDEX idx_transactions_user ON public.transactions(user_id);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX idx_user_links_uid ON public.user_exchange_links(exchange_uid);

-- Trigger: Handle New User
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger: Update Timestamps
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_links_modtime BEFORE UPDATE ON public.user_exchange_links FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_claims_modtime BEFORE UPDATE ON public.claim_requests FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_exchange_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_requests ENABLE ROW LEVEL SECURITY;

-- Basic Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can view own links" ON public.user_exchange_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own txns" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own claims" ON public.claim_requests FOR SELECT USING (auth.uid() = user_id);

COMMIT;