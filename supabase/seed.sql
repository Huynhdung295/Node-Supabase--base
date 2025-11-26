-- 1. Seed Tiers
INSERT INTO public.tiers (name, slug, priority, color_hex) VALUES
('Bronze', 'bronze', 1, '#CD7F32'),
('Silver', 'silver', 2, '#C0C0C0'),
('Gold', 'gold', 3, '#FFD700'),
('Platinum', 'platinum', 4, '#E5E4E2'),
('Diamond', 'diamond', 5, '#B9F2FF')
ON CONFLICT (slug) DO NOTHING;

-- 2. Seed Exchanges
INSERT INTO public.exchanges (code, name, status, config_json) VALUES
('BINANCE', 'Binance', 'active', '{"api_url": "https://api.binance.com"}'::jsonb),
('BYBIT', 'Bybit', 'active', '{"api_url": "https://api.bybit.com"}'::jsonb),
('OKX', 'OKX', 'maintenance', '{}'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- 3. Seed Exchange Tier Configs (Example: Binance)
DO $$
DECLARE
    binance_id INT;
    bronze_id INT;
    silver_id INT;
    gold_id INT;
BEGIN
    SELECT id INTO binance_id FROM public.exchanges WHERE code = 'BINANCE';
    SELECT id INTO bronze_id FROM public.tiers WHERE slug = 'bronze';
    SELECT id INTO silver_id FROM public.tiers WHERE slug = 'silver';
    SELECT id INTO gold_id FROM public.tiers WHERE slug = 'gold';

    IF binance_id IS NOT NULL THEN
        INSERT INTO public.exchange_tier_configs (exchange_id, tier_id, required_points, default_commission_rate)
        VALUES
        (binance_id, bronze_id, 0, 0.10),
        (binance_id, silver_id, 1000, 0.15),
        (binance_id, gold_id, 5000, 0.20)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 4. Seed Users (Mocking auth.users + public.profiles)

-- User 1: Admin
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
    '00000000-0000-0000-0000-000000000001', 
    'admin@example.com', 
    '$2a$10$hashedpasswordplaceholder', -- Password giả
    NOW(), 
    '{"full_name": "Admin User"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Update Profile Admin (Trigger đã tạo profile rồi, giờ chỉ update role)
UPDATE public.profiles 
SET role = 'admin', 
    current_tier_id = (SELECT id FROM public.tiers WHERE slug = 'diamond')
WHERE id = '00000000-0000-0000-0000-000000000001';


-- User 2: Regular User
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
    '00000000-0000-0000-0000-000000000002', 
    'user@example.com', 
    '$2a$10$hashedpasswordplaceholder', 
    NOW(), 
    '{"full_name": "Regular User"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

UPDATE public.profiles 
SET current_tier_id = (SELECT id FROM public.tiers WHERE slug = 'silver')
WHERE id = '00000000-0000-0000-0000-000000000002';


-- User 3: Affiliate User
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
    '00000000-0000-0000-0000-000000000003', 
    'aff@example.com', 
    '$2a$10$hashedpasswordplaceholder', 
    NOW(), 
    '{"full_name": "Affiliate User"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

UPDATE public.profiles 
SET ref_code = 'AFF_001',
    current_tier_id = (SELECT id FROM public.tiers WHERE slug = 'gold')
WHERE id = '00000000-0000-0000-0000-000000000003';