-- Add AI analysis persistence to setlists table
ALTER TABLE setlists ADD COLUMN IF NOT EXISTS ai_analysis_json jsonb;
ALTER TABLE setlists ADD COLUMN IF NOT EXISTS ai_analysis_generated_at timestamp;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_setlists_ai_analysis ON setlists(band_id) WHERE ai_analysis_json IS NOT NULL;
