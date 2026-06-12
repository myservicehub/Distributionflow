-- Add email column to retailers table
-- Run this in Supabase SQL Editor

ALTER TABLE retailers
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add index for faster email lookups
CREATE INDEX IF NOT EXISTS retailers_email_idx ON retailers(email);

-- Optional: Add email to unique constraint if you want unique emails
-- ALTER TABLE retailers ADD CONSTRAINT retailers_email_unique UNIQUE (email, business_id);
