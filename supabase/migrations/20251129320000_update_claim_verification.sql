-- Enhanced Claim Verification System Migration
-- Adds new statuses and verification tracking fields

-- Add new status values to claim_status enum
ALTER TYPE claim_status ADD VALUE IF NOT EXISTS 'email_verified';
ALTER TYPE claim_status ADD VALUE IF NOT EXISTS 'verified';
ALTER TYPE claim_status ADD VALUE IF NOT EXISTS 'transferred';
ALTER TYPE claim_status ADD VALUE IF NOT EXISTS 'verify_failed';

-- Add verification tracking columns to claim_requests table
ALTER TABLE claim_requests 
  ADD COLUMN IF NOT EXISTS code_expiry TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_attempts INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cs_verification_code TEXT,
  ADD COLUMN IF NOT EXISTS cs_code_expiry TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES profiles(id);
