-- Add missing ip_address column to audit_logs table
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);

-- Add comment for documentation
COMMENT ON COLUMN audit_logs.ip_address IS 'IP address of the user performing the action';
