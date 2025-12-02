-- Create indexes for claim verification (separate migration)
-- This must be run AFTER the enum values are added

-- Create index for faster queries on verification status
CREATE INDEX IF NOT EXISTS idx_claim_requests_status_expiry 
  ON claim_requests(status, code_expiry) WHERE status = 'wait_email_confirm';

-- Create index for CS claims queries
CREATE INDEX IF NOT EXISTS idx_claim_requests_pending 
  ON claim_requests(status) WHERE status IN ('pending', 'email_verified');
