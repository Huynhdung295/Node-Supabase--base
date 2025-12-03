-- Migration: Add Admin Approval and Refund Tracking to Claims (Part 2: Indexes)
-- Created: 2025-12-02
-- Purpose: Create indexes for admin approval and refund queries
-- Note: Must run AFTER enum values are added in previous migration

-- Create index for admin claims queries
CREATE INDEX IF NOT EXISTS idx_claim_requests_admin_review
  ON claim_requests(status) 
  WHERE status IN ('awaiting_admin_approval', 'admin_approved');

-- Create index for refund queries
CREATE INDEX IF NOT EXISTS idx_claim_requests_refund
  ON claim_requests(status)
  WHERE status IN ('rejected', 'admin_rejected', 'waiting_refund');

-- Create index for read-only claims (final states)
CREATE INDEX IF NOT EXISTS idx_claim_requests_final
  ON claim_requests(status)
  WHERE status IN ('transferred', 'refunded');
