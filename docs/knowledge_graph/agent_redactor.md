---
id: agent_redactor
title: "Agente Redactor (borradores de respuesta)"
layer: agent
domain: booking
file: "server/services/replyDrafting.ts"
tags: ["agent", "booking", "human-in-the-loop"]
---

# 📌 Agente Redactor (borradores de respuesta)

> **Ubicación:** `server/services/replyDrafting.ts`  
> **Capa:** `#layer/agent` | **Dominio:** `#domain/booking`

## 📖 Descripción
Redacta borradores de respuesta a salas. Nunca envía: el borrador pasa por aprobación humana.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[service_pitch_engine|Pitch Engine & Multi-Model Routing]] *(Layer: #service, Domain: #booking)*
- [[db_lead_messages|Lead Messages & Thread DB]] *(Layer: #db, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_venue_detail|Venue Detail & Pitch Simulator]] *(from #frontend)*
- [[sec_prompt_safety|Prompt Injection Sanitizer]] *(from #security)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
