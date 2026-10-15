---
name: telemetry-and-cost-auditor
description: Observabilidad distribuida, auditoría de agentes, seguimiento de errores en dos capas (agent_execution_logs vs Sentry) y contabilidad precisa de tokens/costes en BandManager.io.
---

# 📈 Skill: Telemetry, Observability & Cost Auditor

Esta skill estandariza la observabilidad en producción, el rastreo de eventos del scheduler agéntico y la contabilidad económica de tokens y recursos en BandManager.io.

---

## 👁️ 1. La Arquitectura de Observabilidad en Dos Capas

BandManager.io separa estrictamente la observabilidad en dos capas independientes para evitar la saturación de alertas:

```
+─────────────────────────────────────────────────────────────────────────────+
| CAPA 1: AUDITORÍA DE NEGOCIO AGÉNTICO (Supabase: agent_execution_logs)      |
| Fallos esperables de dominio:                                               |
| - Banda sin cuenta de Gmail conectada o credenciales expiradas              |
| - Sala sin dirección de email válida en scraping                            |
| - Ventana comercial fuera de horario (horas_enviador / dias_enviador)       |
| -> Se audita en BD para panel del usuario y reintentos del scheduler        |
+─────────────────────────────────────────────────────────────────────────────+
                                      vs
+─────────────────────────────────────────────────────────────────────────────+
| CAPA 2: TELEMETRÍA DE BUGS INESPERADOS (Sentry + ErrorBoundary)             |
| Errores técnicos no anticipados:                                            |
| - Excepciones no capturadas en Express (500)                                |
| - Errores de renderizado en React (ErrorBoundary de src/utils/errorTracking)|
| - Desconexiones críticas de PostgreSQL o caídas de APIs externas             |
| -> Notificación a Sentry (solo si SENTRY_DSN está definido, no-op en local) |
+─────────────────────────────────────────────────────────────────────────────+
```

---

## 💰 2. Contabilidad de Tokens e Inferencia IA (`aiLedger`)

Cada llamada a modelos generativos (Gemini, DeepSeek, OpenAI) debe registrarse en la tabla `ai_token_ledger`:

1. **Tokens de Entrada y Salida:** Registrar `prompt_tokens` y `completion_tokens`.
2. **Scoping por Banda:** El registro de consumo se asocia indefectiblemente al `band_id` autenticado.
3. **Control de Presupuesto:** Comprobar el crédito de la banda (`POST /billing/consume-credits`) antes de despachar tareas costosas (ej. generación musical o análisis de audio).

---

## ⏱️ 3. Trazabilidad del Scheduler In-Process

- Cada tick del scheduler (24 h por defecto, configurable) registra su timestamp de inicio y fin en `agent_schedule_state`.
- Las tareas atómicas (ejecución del Scout, despacho del Enviador, lectura del Lector) registran:
  - Duración de ejecución en milisegundos.
  - Número de leads procesados.
  - Estado final (`success`, `degraded`, `error`).

---

## ✅ Checklist de Telemetría y Costes

- [ ] ¿Los fallos de negocio esperables se registran en `agent_execution_logs`?
- [ ] ¿Los errores no anticipados se delegan a `server/utils/errorTracking.ts`?
- [ ] ¿Toda invocación a APIs de IA registra su consumo en `aiLedger`?
- [ ] ¿Se previene la degradación silenciosa registrando métricas de latencia?
