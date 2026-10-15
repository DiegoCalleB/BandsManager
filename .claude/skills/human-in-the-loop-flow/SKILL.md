---
name: human-in-the-loop-flow
description: Human-in-the-loop state protocol, agent execution lifecycle, and dispatch safety rules for BandManager.io. Works across Claude Code, Open Code, Cursor, and Gemini.
---

# 🎭 Skill: Human-in-the-Loop & Agentic Dispatch Protocol (Universal Agent Standard)

Protocolo de control de autonomía agéntica para garantizar el principio no negociable: **ningún correo sale enviado a una sala sin la revisión y aprobación explícita del usuario**.

---

## 🔄 1. Transiciones de Estado del CRM & Agente

El flujo de vida de un Lead sigue la siguiente máquina de estados bidimensional (`Lead.estado`):

```
[Scout] ➔ estado: 'nuevo'
   ↓
[Redactor] ➔ Genera borrador en Supabase ➔ estado: 'pendiente_aprobacion'
   ↓
[Usuario UI] ➔ Revisa/Edita borrador ➔ Aprueba ➔ estado: 'aprobado_propuesta' / 'aprobado_respuesta'
   ↓
[Enviador / agentEngine] ➔ Lee estado aprobado ➔ Despacha correo ➔ estado: 'contactado' / 'esperando_respuesta'
   ↓
[Lector / lectorAgent] ➔ Detecta respuesta de la sala ➔ estado: 'respondido'
```

---

## 🛡️ 2. Reglas de Despacho Seguro (`agentEngine.ts`)

1. **Filtro de Despacho:** El enviador SOLO selecciona registros cuyo estado sea exactamente `aprobado_propuesta` o `aprobado_respuesta`.
2. **Interruptor Global de Entorno:**
   - Si `AGENT_EMAIL_MODE=send`: Despacho real de correos mediante API / SMTP / Gmail OAuth2.
   - Si `AGENT_EMAIL_MODE=draft` (predeterminado seguro): Deposita el correo como borrador para inspección final.
3. **Auditoría de Errores:**
   - Fallos de negocio (cuenta no conectada, email de sala inválido) se registran en `agent_execution_logs`.
