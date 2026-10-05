---
id: route_leads_reply
title: "Leads Reply Route"
layer: route
domain: booking
file: "server/routes/leads/reply.ts"
tags: ["api", "route", "reply", "ai"]
---

# 📌 Leads Reply Route

> **Ubicación:** `server/routes/leads/reply.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/booking`

## 📖 Descripción
Endpoint para redacción automática de respuestas en hilos de negociación.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[sec_prompt_safety|Prompt Injection Sanitizer]] *(Layer: #security, Domain: #system)*
- [[service_pitch_engine|Pitch Engine & Multi-Model Routing]] *(Layer: #service, Domain: #booking)*
- [[db_lead_messages|Lead Messages & Thread DB]] *(Layer: #db, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_venue_detail|Venue Detail & Pitch Simulator]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
