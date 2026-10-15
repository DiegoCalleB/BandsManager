---
name: agentic-runtime-telemetry
description: Observability, two-layer error tracking (agent_execution_logs vs Sentry), and precise AI token accounting in aiLedger for Claude Code, Open Code, Cursor, and Gemini.
---

# 📈 Skill: Agentic Runtime Telemetry & Cost Accounting (Universal Agent Standard)

Estandariza la observabilidad en producción, la auditoría del scheduler agéntico y la contabilidad económica de tokens y recursos en BandManager.io.

---

## 👁️ 1. Las Dos Capas de Observabilidad

1. **Capa 1: Auditoría de Negocio Agéntico (`agent_execution_logs` en Supabase):**
   - Registra fallos esperables de dominio (ej. credenciales de Gmail expiradas, salas sin email válido, fuera de ventana comercial).
   - Visible en el panel de control del usuario para reintentos y transparencia.
2. **Capa 2: Telemetría de Errores Técnicos (Sentry + ErrorBoundary):**
   - Captura excepciones inesperadas (500) y fallos de renderizado en React. No-op en local si no hay DSN configurado.

---

## 💰 2. Contabilidad de Tokens e Inferencia IA (`aiLedger`)

- Toda invocación a modelos generativos (Gemini, DeepSeek, OpenAI, Claude) debe auditar tokens de entrada/salida en `ai_token_ledger`.
- Scoping estricto por `band_id` para control de costes y límites de suscripción.
