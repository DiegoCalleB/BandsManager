-- ====================================================================
-- MIGRACIÓN SUPABASE: PLANTILLA DE PITCH POR CAMPAÑA Y CASO DE USO
-- (BandManager.ai)
-- ====================================================================
--
-- Añade el campo que server/utils/bandDna.ts (buildEnhancedPitchSystemPrompt)
-- ya esperaba leer de la campaña activa (activeCampaign.custom_pitch_templates)
-- pero que nunca llegó a persistirse. Permite definir, por campaña y por caso
-- de uso (salas/festivales/discotecas/medios/grupos/managements/ayuntamientos
-- — las mismas 7 categorías que server/promptsManager.ts ya usa para las
-- plantillas generales), un mensaje clave que el Redactor prioriza sobre la
-- plantilla de esa categoría mientras la campaña esté activa. Una categoría
-- sin entrada en el JSON sigue usando solo su plantilla habitual.
--
-- Formato: {"salas": "mensaje...", "festivales": "otro mensaje...", ...}

ALTER TABLE IF EXISTS public.campaigns
    ADD COLUMN IF NOT EXISTS custom_pitch_templates JSONB DEFAULT '{}'::jsonb;

ALTER TABLE IF EXISTS public.booking_campaigns
    ADD COLUMN IF NOT EXISTS custom_pitch_templates JSONB DEFAULT '{}'::jsonb;
