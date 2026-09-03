-- Migration: Add agent_sender_email, agent_sender_name, agent_reply_to_email to autonomy_configs (BandManager.ai)
-- Permite persistir la identidad del remitente de los agentes IA por banda.

ALTER TABLE autonomy_configs ADD COLUMN IF NOT EXISTS agent_sender_email TEXT;
ALTER TABLE autonomy_configs ADD COLUMN IF NOT EXISTS agent_sender_name TEXT;
ALTER TABLE autonomy_configs ADD COLUMN IF NOT EXISTS agent_reply_to_email TEXT;

COMMENT ON COLUMN autonomy_configs.agent_sender_email IS 'Email remitente configurado por la banda para los agentes IA';
COMMENT ON COLUMN autonomy_configs.agent_sender_name IS 'Nombre/cargo remitente que firma las propuestas de los agentes IA';
COMMENT ON COLUMN autonomy_configs.agent_reply_to_email IS 'Email de respuesta (Reply-To) opcional para los agentes IA';
