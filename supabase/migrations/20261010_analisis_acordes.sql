-- Acordes con tiempos detectados del audio (Chordify propio, fase 1).
-- Estructura: { version, analizadoEn, fuente, duracionSegundos, tonalidad, segmentos:[{t0,t1,acorde,confianza,editado?}] }
-- Idempotente. Mientras no se ejecute, el resto de la app funciona igual: solo falla
-- «Analizar acordes del audio», con un mensaje que lo explica.
ALTER TABLE songs ADD COLUMN IF NOT EXISTS analisis_acordes JSONB;
