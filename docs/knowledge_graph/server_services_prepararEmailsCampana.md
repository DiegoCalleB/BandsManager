---
id: server_services_prepararEmailsCampana
title: "server/services/prepararEmailsCampana.ts"
layer: service
domain: system
file: "server/services/prepararEmailsCampana.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/prepararEmailsCampana.ts

> **Ubicación:** `server/services/prepararEmailsCampana.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Prepara los emails de una campaña de festivales: rellena la plantilla de la campaña con los datos reales de cada

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(Layer: #db, Domain: #system)*
- [[server_db|server/db.ts]] *(Layer: #db, Domain: #system)*
- [[server_db_epk|server/db/epk.ts]] *(Layer: #db, Domain: #epk)*
- [[server_utils_bandDna|server/utils/bandDna.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_reglasPitchFestival|server/utils/reglasPitchFestival.ts]] *(Layer: #service, Domain: #booking)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_bookingUtils|src/utils/bookingUtils.ts]] *(Layer: #service, Domain: #booking)*
- [[src_utils_campaignMatch|src/utils/campaignMatch.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_plantillaFestival|src/utils/plantillaFestival.ts]] *(Layer: #service, Domain: #system)*
- [[tabla_leads|tabla leads]] *(Layer: #schema, Domain: #booking)*
- [[tabla_registered_bands|tabla registered_bands]] *(Layer: #schema, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_campaigns|server/routes/campaigns.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/prepararEmailsCampana.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
