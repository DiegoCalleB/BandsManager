-- ====================================================================
-- MIGRATION: rehearsals — tipo_evento, asunto, enlace_reunion
-- server/db/rehearsals.ts ya los lee/escribe, pero ninguna migración los creaba:
-- PUT /api/ensayos/:id guardaba "parcial" y mostraba «Gardamento incompleto».
-- ====================================================================

ALTER TABLE public.rehearsals
  ADD COLUMN IF NOT EXISTS tipo_evento TEXT DEFAULT 'ensayo',
  ADD COLUMN IF NOT EXISTS asunto TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS enlace_reunion TEXT DEFAULT '';
