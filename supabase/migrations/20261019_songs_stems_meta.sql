-- Metadatos del motor de separación (Iris) como dato de la canción: songs.stems_meta.
-- Hoy viven en la idea de audio (audio_ideas[].stemEngineUsed/stemIsNeural/stemDegraded/stemProcessedAt).
-- Idempotente y reversible: no toca audio_ideas (rollback = DROP COLUMN stems_meta).
ALTER TABLE songs ADD COLUMN IF NOT EXISTS stems_meta JSONB;

UPDATE songs s
SET stems_meta = sub.m
FROM (
  SELECT s2.id,
         (SELECT jsonb_strip_nulls(jsonb_build_object(
                   'motor', i->'stemEngineUsed',
                   'neural', i->'stemIsNeural',
                   'degradado', i->'stemDegraded',
                   'procesadoEn', i->'stemProcessedAt'))
            FROM jsonb_array_elements(s2.audio_ideas) AS i
           WHERE i->>'stemEngineUsed' IS NOT NULL
              OR (jsonb_typeof(i->'pistas') = 'array' AND jsonb_array_length(i->'pistas') > 1)
           LIMIT 1) AS m
    FROM songs s2
   WHERE s2.stems_meta IS NULL
     AND jsonb_typeof(s2.audio_ideas) = 'array'
) sub
WHERE s.id = sub.id
  AND sub.m IS NOT NULL
  AND sub.m <> '{}'::jsonb;
