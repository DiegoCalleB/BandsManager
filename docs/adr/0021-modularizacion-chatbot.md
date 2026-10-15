# ADR: Modularización de Chatbot con hooks por subdominio, contexto y vistas

**Estado:** aceptada · **Contexto:** AGENTS.md §5.6 (límite de 800 líneas), continuación de [0020](./0020-modularizacion-agent-autonomy-settings-modal.md)

## Problema
`src/components/Chatbot.tsx` tenía 2675 líneas: historial persistido, dictado por voz, generación de acompañamientos e ideas melódicas, seguimiento de agentes autónomos, envío al asistente y una función de ~820 líneas (`handleConfirmAction`) que ejecutaba doce tipos de acciones propuestas, más ~770 líneas de JSX.

## Decisión
Se mantiene el contrato público (`export default Chatbot` y los tipos `ChatMessage`, `ProposedAction`) y se extrae a `components/chatbot/`:

- **Tipos** compartidos (`chatTypes.ts`: mensajes, acciones, ejecuciones de agente, respuestas de API) y `chatFormatting.tsx` (Markdown ligero, función pura, no hook).
- **Hooks:** `useChatIdentity`, `useChatMessages`, `useVoiceInput`, `useAgentRuns`, `useChatAudioGeneration`, `useChatSend`, `useChatActions` (confirmar/descartar) que delega en `useLeadEmailActions`, `useEntityActions` y `useAgentTriggerAction`, y el controlador `useChatController`.
- **`handleConfirmAction`:** la cadena de `if/else if` pasó a doce funciones `applyX` (una por tipo de acción) repartidas en tres hooks; el despacho conserva el orden y las condiciones originales.
- **Contexto** `ChatContext` + `ChatProvider` y **vistas** `ChatLayout`, `ChatMessageBubble`, `ActiveRunPanel`, `ChatLoadingIndicator`, `ChatInputForm`, `AutonomyModalHost`.

## Resultado

| Métrica | Antes | Después |
|---|---|---|
| Líneas de `Chatbot.tsx` | 2675 | ~40 |
| Archivo más grande creado | — | 418 (`useEntityActions`) |
| `any` / `@ts-ignore` en los archivos creados | ~85 | 0 |
| ESLint en los archivos creados | no medido | 0 errores, 2 avisos `exhaustive-deps` heredados |

## Cambios deliberados
- Dictado por voz: interfaces mínimas de la Web Speech API en lugar de `any`.
- `catch (err: any)` → `catch (err)` con `getErrorMessage`; los `catch {}` vacíos llevan comentario.
- El tipo de `onCreateLead` admite devolver el lead creado (lo que ya hacía `App`).
- Tres `eslint-disable-next-line` justificados: restauración del historial al cambiar de banda (`set-state-in-effect`) y ids de leads simulados de la demo (`purity`).

## Defectos preexistentes detectados y NO corregidos
- **Secretos en el cliente:** `useAgentRuns` lee `bandmanager_github_pat` (token de GitHub) de `localStorage` para consultar los workflows. Un PAT no debería vivir en el navegador; la consulta debería hacerla el servidor.
- **Claves sin `band_id`:** `bandmanager_agents_enabled`, `bandmanager_agent_autonomy` y `bandmanager_github_ref` se guardan sin `band_id` (AGENTS.md §2.5). El historial sí usa `bandmanager_chat_messages_{userId}_{bandId}`. El test de seguridad limita las escrituras a esa lista.
- `api.createLead` está tipado como `Promise<Lead>` pero el chat lee `res.lead`; se mantiene con un cast local hasta aclarar el contrato.
- `ProposedAction.params` y el estado de ejecución se tipan ahora, pero `/api/agent-runs` se consulta con `fetch` directo y el cliente envía parámetros de región; el servidor debe resolver la banda con `getTargetBandId`.
