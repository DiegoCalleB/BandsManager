-- Add energia_bpm_detectado column to songs table
-- Stores the detected BPM estimated from audio energy onsets
-- Used alongside energia_db_promedio for hybrid energy calculation

ALTER TABLE songs ADD COLUMN IF NOT EXISTS energia_bpm_detectado numeric;

-- Add index for faster queries filtering by this column
CREATE INDEX IF NOT EXISTS idx_songs_energia_bpm_detectado ON songs(energia_bpm_detectado) WHERE energia_bpm_detectado IS NOT NULL;
