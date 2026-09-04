-- Add energia_db_promedio column to songs table
-- Stores the raw RMS average (in dB) used for band-relative energy normalization

ALTER TABLE songs ADD COLUMN IF NOT EXISTS energia_db_promedio numeric;

-- Add index for faster queries filtering by this column
CREATE INDEX IF NOT EXISTS idx_songs_energia_db_promedio ON songs(energia_db_promedio) WHERE energia_db_promedio IS NOT NULL;
