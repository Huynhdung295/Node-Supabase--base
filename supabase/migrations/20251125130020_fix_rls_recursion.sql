-- Fix RLS Policies - Remove Infinite Recursion
-- Run this ASAP to fix login issues

-- Drop problematic policies
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;

-- Recreate WITHOUT recursion
-- Users can view own profile OR service role can view all
CREATE POLICY "profiles_select_policy" ON public.profiles 
FOR SELECT 
USING (
    auth.uid() = id  -- Own profile
    OR auth.jwt() ->> 'role' = 'service_role'  -- Service role
);

-- Users can update own profile OR service role
CREATE POLICY "profiles_update_policy" ON public.profiles 
FOR UPDATE 
USING (
    auth.uid() = id  -- Own profile
    OR auth.jwt() ->> 'role' = 'service_role'  -- Service role  
);

-- Only service role can insert (during registration)
CREATE POLICY "profiles_insert_policy" ON public.profiles 
FOR INSERT 
WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
);
