-- Marca de tiempo de la última vez que Iris detectó BPM/tonalidad automáticamente desde el
-- audio, para poder mostrar en el UI "detectado automáticamente" junto al valor.
-- No se añade una columna "_manual" (a diferencia de energia_manual): a diferencia del
-- recalibrado de energía, que se dispara para TODA la banda cada vez que se analiza una sola
-- canción, la detección de bpm/tonalidad de una canción solo se repite cuando esa misma canción
-- recibe audio nuevo o pasa por separación de pistas con Iris — nunca como efecto secundario de
-- analizar otra canción — así que el riesgo de sobrescribir silenciosamente una corrección
-- manual es bajo y no justifica aún la columna extra.

ALTER TABLE songs ADD COLUMN IF NOT EXISTS bpm_detectado_en timestamp with time zone;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS tonalidad_detectada_en timestamp with time zone;
