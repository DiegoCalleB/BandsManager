-- Tercera señal cruda para el cálculo de energía (además de bpm/volumen ya existentes): densidad
-- rítmica en onsets/segundo, medida por el mismo detector de onsets que ya alimenta el BPM
-- (analizarAudioConIris). Antes la "energía" solo combinaba tempo + volumen medio a partes
-- iguales — dos temas al mismo BPM y volumen pueden sonar muy distinto de "cañeros" según cuántos
-- ataques por segundo tengan (una base sincopada densa vs un tema espaciado), y el volumen medio
-- por sí solo confunde intensidad real con nivel de masterización de la grabación.

ALTER TABLE songs ADD COLUMN IF NOT EXISTS energia_onset_density double precision;
