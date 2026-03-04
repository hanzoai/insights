-- Add name and description columns to insights_errortrackingissue
ALTER TABLE insights_errortrackingissue ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE insights_errortrackingissue ADD COLUMN IF NOT EXISTS description TEXT;

-- Add first_seen column to insights_errortrackingissuefingerprintv2
ALTER TABLE insights_errortrackingissuefingerprintv2 ADD COLUMN IF NOT EXISTS first_seen TIMESTAMPTZ;
