---
id: src_data_mouredevBandsSeed
title: "src/data/mouredevBandsSeed.ts"
layer: service
domain: system
file: "src/data/mouredevBandsSeed.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/data/mouredevBandsSeed.ts

> **Ubicación:** `src/data/mouredevBandsSeed.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: HERDEIROS_BAND_ID, MASTER_OF_PROMPTS_BAND_ID, HERDEIROS_LEADS, HERDEIROS_BANDS, HERDEIROS_SONGS, HERDEIROS_SETLISTS, HERDEIROS_CONCERTS, HERDEIROS_REHEARSALS.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(from #db)*
- [[src_db_seed|src/db_seed.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
