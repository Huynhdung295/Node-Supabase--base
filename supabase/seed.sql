-- Seed data cho development
-- File này sẽ chạy sau khi migrations

-- Insert sample users (passwords sẽ được hash bởi Supabase Auth)
-- Đây chỉ là data mẫu cho profiles table

-- Admin user
INSERT INTO public.profiles (id, email, full_name, role, tier_vip, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin@example.com', 'Admin User', 'admin', 'diamond', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', 'user@example.com', 'Regular User', 'user', 'silver', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000003', 'aff@example.com', 'Affiliate User', 'aff', 'gold', NOW(), NOW());

-- Sample data cho testing
INSERT INTO public.profiles (email, full_name, role, tier_vip)
VALUES 
  ('test1@example.com', 'Test User 1', 'user', 'silver'),
  ('test2@example.com', 'Test User 2', 'user', 'gold'),
  ('aff2@example.com', 'Affiliate 2', 'aff', 'diamond');
