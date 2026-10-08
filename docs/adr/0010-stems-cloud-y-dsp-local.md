# ADR 0010: Separación de pistas con modelos en GPU y DSP local

- **Estado:** Aceptada
- **Fecha:** anterior a 2026-10-08 (no consta en el repo)
- **Origen:** retroactiva. Fuentes: `server/services/audioSeparator/` (`AudioSeparatorFactory.ts`, `AudioSeparatorService.ts`, `FalAiService.ts`, `LalalAiService.ts`, `LocalDspService.ts`), y `docs/referencia/DOCUMENTACION_ARQUITECTURA_SISTEMA.md` §3 y §4.

## Contexto

Separar voz, batería, bajo y resto de una canción es caro en GPU y es el módulo que más coste genera por usuario. Algunos usuarios sólo quieren una separación aproximada y sin pagar nada.

## Decisión

Dos motores detrás de una misma interfaz (`AudioSeparatorFactory`): modelos neuronales en servicios de GPU en la nube (Fal.ai, LALAL.AI) cuando hay calidad necesaria, y un motor DSP local (`LocalDspService`) de coste cero para una separación aproximada. Un modo «auto» elige según disponibilidad y coste, con caché de resultados (`song_stems_cache`, 48 filas).

## Alternativas descartadas

- **Solo nube:** coste por uso sin alternativa gratuita.
- **Solo local:** la calidad de la separación DSP no es suficiente para el uso de estudio.
- **Modelo propio en GPU propia:** coste fijo y operación de GPU que el proyecto no puede asumir.

## Consecuencias

- Dos caminos con calidades distintas: la UI debe dejarlo claro al usuario (pendiente de revisar).
- Dependencia de proveedores externos y de su política de precios.
- Los reintentos de subida a almacenamiento tienen su propia cola (`stem_storage_retry_queue`).
