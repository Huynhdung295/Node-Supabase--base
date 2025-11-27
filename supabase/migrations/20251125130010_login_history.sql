-- Create login_history table
CREATE TABLE IF NOT EXISTS login_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  location VARCHAR(255),
  login_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_login_at ON login_history(login_at DESC);

-- Function to auto-delete old records (keep max 50 per user)
CREATE OR REPLACE FUNCTION cleanup_old_login_history()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM login_history
  WHERE id IN (
    SELECT id FROM login_history
    WHERE user_id = NEW.user_id
    ORDER BY login_at DESC
    OFFSET 50
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger after insert
DROP TRIGGER IF EXISTS trigger_cleanup_login_history ON login_history;
CREATE TRIGGER trigger_cleanup_login_history
AFTER INSERT ON login_history
FOR EACH ROW
EXECUTE FUNCTION cleanup_old_login_history();

-- Enable RLS
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own login history
CREATE POLICY "Users can view own login history"
  ON login_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can insert
CREATE POLICY "Service can insert login history"
  ON login_history
  FOR INSERT
  WITH CHECK (true);
