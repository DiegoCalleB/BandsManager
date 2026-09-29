---
id: route_leads_pitch
title: "Leads Pitch Generation Route"
layer: route
domain: booking
file: "server/routes/leads/pitch.ts"
tags: ["api", "route", "pitch", "ai"]
---

# 📌 Leads Pitch Generation Route

> **Ubicación:** `server/routes/leads/pitch.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/booking`

## 📖 Descripción
Endpoint para generación de pitches con IA y validación de Rate Limiting.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[sec_prompt_safety|Prompt Injection Sanitizer]] *(Layer: #security, Domain: #system)*
- [[service_pitch_engine|Pitch Engine & Multi-Model Routing]] *(Layer: #service, Domain: #booking)*
- [[db_ai_ledger|AI Token Ledger]] *(Layer: #db, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_venue_detail|Venue Detail & Pitch Simulator]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
