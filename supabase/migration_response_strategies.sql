-- Migration: Add response_strategies column to autonomy_configs
-- Purpose: Store conditional response guidance per band for auto-replies

ALTER TABLE autonomy_configs
ADD COLUMN IF NOT EXISTS response_strategies JSONB DEFAULT '{}'::jsonb;

-- Comment explaining the structure
COMMENT ON COLUMN autonomy_configs.response_strategies IS
'JSON object mapping response types (price_negotiation, confirmation, rejection, follow_up) to strategy configs. Each strategy can include: guidancePrompt (AI instruction), tone (neutral/enthusiastic/cautious), mentionLinks (boolean)';
