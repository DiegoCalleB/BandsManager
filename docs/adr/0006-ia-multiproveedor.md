# ADR 0006: IA multi-proveedor con Gemini por defecto y DeepSeek de respaldo

- **Estado:** Aceptada
- **Fecha:** 2026-10-06 (primer commit del fichero; el historial de git empieza ese día, la decisión puede ser anterior)
- **Origen:** retroactiva. Fuentes: `server/services/pitchEngine.ts:367` (`providers || ["gemini", "deepseek"]`), `server/ai.ts` (conmutación a DeepSeek ante el tope de gasto de Gemini), `scripts/` y `docs/referencia/TOOL_COMPATIBILITY.md`.

## Contexto

La generación de textos (borradores, pitch, reels) depende de un proveedor de modelos cuyo precio, cuota o disponibilidad puede cambiar de un día para otro. Un único proveedor es un punto de fallo y de coste.

## Decisión

El motor de pitch intenta Gemini por defecto y cambia a DeepSeek V3 cuando Gemini responde con el tope de gasto mensual o falla. La elección queda registrada en el ledger de IA (`ai_token_ledger`) para medir coste por proveedor.

## Alternativas descartadas

- **Un solo proveedor:** más simple, pero un tope de gasto o una caída paran toda la captación.
- **Enrutado por coste en cada petición:** complejidad que no se justifica con el volumen actual.

## Consecuencias

- Los prompts deben funcionar con más de un modelo. La compatibilidad se documenta en `docs/referencia/TOOL_COMPATIBILITY.md`.
- El ledger de IA en producción está vacío en este momento (`ai_token_ledger`: 0 filas), así que el coste real por proveedor aún no se mide. Es una afirmación que hay que mantener al día.
- OpenAI aparece en el código del motor de pitch y del chat; **no está verificado en este ADR** como proveedor activo. Pendiente de confirmar.
