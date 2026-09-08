---
name: agentic-harness
description: Guía de arquitectura para los agentes de IA (Booking CRM, Reels, Music Studio) y control del Scheduler en BandManager.ai. Usar al modificar agentEngine.ts, lectorAgent.ts, scheduler o flujos agénticos.
---

# 🤖 Skill: Agentic Harness & Human-in-the-Loop Architecture

Esta skill establece los patrones de arquitectura para el desarrollo, mantenimiento y supervisión del ecosistema de **Agentes de Inteligencia Artificial** en BandManager.ai (objeto central del TFM).

---

## ⚙️ 1. Máquina de Estados en 2 Dimensiones

Los agentes interactúan con los leads del booking CRM a través de un modelo de estados bidimensional para garantizar consistencia:

```
+-------------------------------------------------------------------------+
| DIMENSIÓN 1: Estado del Lead CRM (estado)                                |
| nuevo -> contactado / esperando_respuesta -> respondido -> negociando    |
| -> confirmado | aplazado | no_interesado                                |
+-------------------------------------------------------------------------+
| DIMENSIÓN 2: Cola Agéntica / Human-in-the-Loop (sub_estado)              |
| pitch_generado -> pendiente_aprobacion -> aprobado_propuesta              |
| / aprobado_respuesta -> borrador_creado / enviado                       |
+-------------------------------------------------------------------------+
```

---

## 🛠️ 2. Flujo de Vida de los Agentes de Booking

```mermaid
graph TD
    Scout[1. Scout Agent] -->|Registra sala en 'nuevo'| Supabase
    Supabase --> Redactor[2. Redactor Agent]
    Redactor -->|Genera propuesta en 'pendiente_aprobacion'| Dashboard[UI Human-in-the-Loop]
    Dashboard -->|Aprobación Explícita por el Usuario| Aprobado[Sub-estado: aprobado_propuesta / respuesta]
    Aprobado --> Enviador[3. Enviador Agent]
    Enviador -->|Comprueba AGENT_EMAIL_MODE y dispatch_mode| Envio[Crea Borrador o Envía Directo]
    Lector[4. Lector Agent] -->|Monitoriza respuestas cada ~60s| Transicion[Transiciona Lead a 'respondido' o 'negociando']
```

### Reglas Invariable de Seguridad Agéntica
1. **NUNCA auto-enviar sin aprobación humana:** Ningún correo sale de la plataforma si el lead no ha sido marcado explícitamente como `aprobado_propuesta` o `aprobado_respuesta` por una persona en el panel web.
2. **Global Fail-Safe Switch:** El motor de despacho (`server/services/agentEngine.ts`) exige que `AGENT_EMAIL_MODE=send` esté configurado en el servidor para efectuar envíos reales. De lo contrario, opera en modo borrador seguro (`draft`).
3. **Preferir Gmail OAuth2:** Al despachar o leer respuestas, el sistema debe consultar `tieneGmailOAuthConectado(bandId)` y dar prioridad a OAuth2 sobre credenciales SMTP/IMAP.

---

## ⏱️ 3. Operación del Scheduler In-Process (`agentScheduler.ts`)

- El planificador corre un bucle in-process cada ~60 segundos.
- Mantiene estado de ejecución en la tabla `agent_schedule_state` para evitar duplicidad de envíos tras un despliegue en Railway.
- **Enviador:** Respeta la ventana comercial de la banda (`horas_enviador`, `dias_enviador`).
- **Lector:** Corre incondicionalmente en cada tick para detectar inmediatamente respuestas entrantes o borradores enviados a mano en Gmail.

---

## 🎬 4. Agentes Auxiliares (Reels & Music Studio)

### Reels / Social Radar Agent
- Genera copias y scripts respetando el **Tone DNA** de cada banda (`src/components/ReelsCenter.tsx`).
- El procesamiento multimedia debe ser asíncrono y los clips finales guardarse en **Supabase Storage**.

### AI Music & Sound Agent
- Combina llamadas a Gemini (Lyria) para generación de audio prompt con `tone.js` para sintetizadores locales.
- **Validación de armónicos:** Toda secuencia MIDI generada por la IA debe pasar por `src/utils/musicTheory.ts` para reparar notas o intervalos disonantes antes de la síntesis.

---

## ✅ Checklist de Arquitectura Agéntica

- [ ] ¿Cualquier nuevo flujo agéntico respeta la máquina de estados 2D?
- [ ] ¿Está garantizado el paso de aprobación humana en la UI?
- [ ] ¿El Enviador consulta `AGENT_EMAIL_MODE` y el `dispatch_mode` de la banda?
- [ ] ¿Se utiliza `tieneGmailOAuthConectado()` como vía prioritaria para correo?
- [ ] ¿Los resultados multimedia se guardan en Supabase Storage?
