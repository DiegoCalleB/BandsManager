---
id: server_tiposAutoEnrichment
title: "server/tiposAutoEnrichment.ts"
layer: service
domain: booking
file: "server/tiposAutoEnrichment.ts"
tags: ["service", "booking", "auto"]
---

# 📌 server/tiposAutoEnrichment.ts

> **Ubicación:** `server/tiposAutoEnrichment.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/booking`

## 📖 Descripción
Formas de los datos externos que lee `auto_enrichment.ts`: el JSON que devuelve la IA y la

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_scout|Scout Discovery Agent]] *(from #agent)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
