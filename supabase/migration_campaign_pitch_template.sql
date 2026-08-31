-- ====================================================================
-- MIGRACIÓN SUPABASE: PLANTILLA DE PITCH POR CAMPAÑA (BandManager.ai)
-- ====================================================================
--
-- Añade el campo que server/utils/bandDna.ts (buildEnhancedPitchSystemPrompt)
-- ya esperaba leer de la campaña activa (activeCampaign.custom_pitch_template)
-- pero que nunca llegó a persistirse. Permite definir, por campaña, un mensaje
-- clave/plantilla que el Redactor prioriza sobre la plantilla de categoría
-- del lead mientras esa campaña esté activa.

ALTER TABLE IF EXISTS public.campaigns
    ADD COLUMN IF NOT EXISTS custom_pitch_template TEXT DEFAULT '';

ALTER TABLE IF EXISTS public.booking_campaigns
    ADD COLUMN IF NOT EXISTS custom_pitch_template TEXT DEFAULT '';
