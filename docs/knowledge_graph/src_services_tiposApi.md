---
id: src_services_tiposApi
title: "src/services/tiposApi.ts"
layer: service
domain: system
file: "src/services/tiposApi.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/services/tiposApi.ts

> **Ubicación:** `src/services/tiposApi.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Formas de las respuestas del servidor que usa `api.ts` y que no tienen ya un tipo en

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_metrics|server/routes/metrics.ts]] *(Layer: #route, Domain: #system)*
- [[src_components_dashboard_agent_autonomy_autonomyTypes|src/components/dashboard/agent_autonomy/autonomyTypes.tsx]] *(Layer: #agent, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_EmailAccountConfig|src/components/EmailAccountConfig.tsx]] *(from #frontend)*
- [[src_components_GmailOAuthEstado|src/components/GmailOAuthEstado.tsx]] *(from #security)*
- [[src_services_api|src/services/api.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
