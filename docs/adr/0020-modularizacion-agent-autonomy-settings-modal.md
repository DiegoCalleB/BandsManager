# ADR: Modularización de AgentAutonomySettingsModal con hooks, contexto y pestañas

**Estado:** aceptada · **Contexto:** AGENTS.md §5.6 (límite de 800 líneas), continuación de [0019](./0019-modularizacion-calendar-view.md)

## Problema
`src/components/dashboard/AgentAutonomySettingsModal.tsx` tenía 2786 líneas: ~40 `useState`, carga/guardado de configuración, estrategias de respuesta, auditoría con exportación CSV y ~2000 líneas de JSX en seis pestañas, además de tipos y constantes declarados dentro del componente.

## Decisión
Se mantiene el contrato público (`AgentAutonomySettingsModal`, `DAYS_OF_WEEK` y los tipos `AgentAutonomyConfig`, `DispatchAutonomyLevel`, `NegotiationDepthLevel`) y se extrae a `dashboard/agent_autonomy/`:

- **Tipos y constantes** de módulo (`autonomyTypes.tsx`, `responseTypes.tsx`): zonas horarias, días, horas, niveles, tipos de respuesta (antes recreados en cada render) y tipos de auditoría.
- **Hooks:** `useAutonomyConfig`, `useResponseStrategies`, `useAutonomyAuditLogs` y el controlador `useAgentAutonomyController`.
- **Contexto** `AgentAutonomyContext` + `Provider` (tipo derivado del controlador).
- **Vistas:** `AutonomyLayout`, `AutonomyHeader`, `AutonomyTabNav`, `ReadOnlyBanner`, `AutonomyFooter` y una vista por pestaña: `AutonomyRedLinesTab` (checklist, aviso, modo de envío, alcance de negociación, parámetros económicos), `EmailDispatchTab`, `SchedulesTab` (presets, mejores días, zona horaria, enviador, lector, monitor), `ToneIdentityTab`, `ResponseStrategiesTab`, `AuditTab`.

## Resultado

| Métrica | Antes | Después |
|---|---|---|
| Líneas de `AgentAutonomySettingsModal.tsx` | 2786 | ~60 |
| Archivo más grande creado | — | 327 (`useAutonomyConfig`) |
| `any` / `@ts-ignore` en los archivos creados | 5 | 0 |
| ESLint en los archivos creados | no medido | 0 errores, 2 avisos `exhaustive-deps` heredados |

## Cambios deliberados
- La comprobación de administrador compara `role` como `string` (llegan roles heredados `manager` y `director` que no están en el tipo `User`); la lógica es idéntica.
- El efecto de carga de auditoría y el de carga de configuración llevan un `eslint-disable-next-line react-hooks/set-state-in-effect` justificado.

## Defectos preexistentes detectados y NO corregidos
- `useAutonomyConfig` guarda la configuración en `localStorage` con la clave `bandmanager_agent_autonomy`, sin `band_id` (AGENTS.md §2.5). La leen otros módulos mediante el evento `autonomy-settings-changed`, así que no se cambia sin migrarlos; el test de seguridad lo registra como excepción única.
- `useAutonomyAuditLogs` llama a `/api/agent-logs?band_id=…` con `fetch` directo y el id desde el cliente; el servidor debe resolver la banda con `getTargetBandId` e ignorar el parámetro (AGENTS.md §2.1).
