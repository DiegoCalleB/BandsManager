-- Stems (pistas separadas por Iris) como dato de la canción: songs.pistas.
-- Hoy viven dentro de la idea de audio (audio_ideas[].pistas). El servidor ya espeja la idea de
-- Iris en esta columna en cada guardado; esta migración rellena las canciones que ya existían.
-- Idempotente y reversible: no toca audio_ideas (rollback = DROP COLUMN pistas).
ALTER TABLE songs ADD COLUMN IF NOT EXISTS pistas JSONB;

UPDATE songs s
SET pistas = sub.p
FROM (
  SELECT s2.id,
         (SELECT i->'pistas'
            FROM jsonb_array_elements(s2.audio_ideas) AS i
           WHERE jsonb_typeof(i->'pistas') = 'array'
             AND jsonb_array_length(i->'pistas') > 1
           LIMIT 1) AS p
    FROM songs s2
   WHERE s2.pistas IS NULL
     AND jsonb_typeof(s2.audio_ideas) = 'array'
) sub
WHERE s.id = sub.id
  AND sub.p IS NOT NULL;
