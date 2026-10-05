---
id: agent_scout
title: "Scout Discovery Agent"
layer: agent
domain: booking
file: "server/auto_enrichment.ts"
tags: ["agent", "scout", "enrichment"]
---

# 📌 Scout Discovery Agent

> **Ubicación:** `server/auto_enrichment.ts`  
> **Capa:** `#layer/agent` | **Dominio:** `#domain/booking`

## 📖 Descripción
Descubre y enriquece información de salas registrándolas en estado nuevo.

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
