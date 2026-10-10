---
id: src_hooks_useNegotiationSimulation
title: "src/hooks/useNegotiationSimulation.ts"
layer: hook
domain: system
file: "src/hooks/useNegotiationSimulation.ts"
tags: ["hook", "system", "auto"]
---

# 📌 src/hooks/useNegotiationSimulation.ts

> **Ubicación:** `src/hooks/useNegotiationSimulation.ts`  
> **Capa:** `#layer/hook` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: useNegotiationSimulation.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_leads_simulation|server/routes/leads/simulation.ts]] *(Layer: #route, Domain: #booking)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_crm_hooks_useLeadFormsAndEnrichment|src/components/booking/crm/hooks/useLeadFormsAndEnrichment.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
