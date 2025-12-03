-- Migration: Add Admin Approval and Refund Tracking to Claims (Part 1: Schema)
-- Created: 2025-12-02
-- Purpose: Add admin approval workflow and explicit refund tracking

-- Add new claim statuses
ALTER TYPE claim_status ADD VALUE IF NOT EXISTS 'awaiting_admin_approval';
ALTER TYPE claim_status ADD VALUE IF NOT EXISTS 'admin_approved';
ALTER TYPE claim_status ADD VALUE IF NOT EXISTS 'admin_rejected';
ALTER TYPE claim_status ADD VALUE IF NOT EXISTS 'waiting_refund';
ALTER TYPE claim_status ADD VALUE IF NOT EXISTS 'refunded';

-- Add admin approval tracking columns
ALTER TABLE claim_requests
  ADD COLUMN IF NOT EXISTS admin_approved_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS admin_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add refund tracking columns
ALTER TABLE claim_requests
  ADD COLUMN IF NOT EXISTS refunded_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refund_amount DECIMAL;

-- Add comments
COMMENT ON COLUMN claim_requests.admin_approved_by IS 'Admin who approved/rejected the claim';
COMMENT ON COLUMN claim_requests.admin_approved_at IS 'Timestamp when admin made decision';
COMMENT ON COLUMN claim_requests.admin_notes IS 'Admin notes for approval/rejection';
COMMENT ON COLUMN claim_requests.refunded_by IS 'CS user who processed the refund';
COMMENT ON COLUMN claim_requests.refunded_at IS 'Timestamp when refund was processed';
COMMENT ON COLUMN claim_requests.refund_amount IS 'Amount refunded to user';
