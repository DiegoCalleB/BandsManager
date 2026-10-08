---
id: route_leads_enrichment
title: "Ruta de enriquecimiento de salas"
layer: route
domain: booking
file: "server/routes/leads/enrichment.ts"
tags: ["route", "booking", "enrichment"]
---

# 📌 Ruta de enriquecimiento de salas

> **Ubicación:** `server/routes/leads/enrichment.ts`  
> **Capa:** `#layer/route` | **Dominio:** `#domain/booking`

## 📖 Descripción
Busca datos públicos de una sala (web, redes) para completar su ficha. Pasa por protección SSRF.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[sec_ssrf_guard|SSRF URL Validator]] *(Layer: #security, Domain: #system)*
- [[db_leads|Leads DB Handlers]] *(Layer: #db, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[sec_ssrf_guard|SSRF URL Validator]] *(from #security)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
