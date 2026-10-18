---
id: server_services_briefCartel
title: "server/services/briefCartel.ts"
layer: service
domain: system
file: "server/services/briefCartel.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/briefCartel.ts

> **Ubicación:** `server/services/briefCartel.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
La idea que la persona tiene del cartel (cinco campos cortos, en español o en lo que sea) →

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[server_services_referenciasCartel|server/services/referenciasCartel.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_promptCartel|server/utils/promptCartel.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_idea|src/utils/cartel/idea.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_cartelria|server/routes/cartelria.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/briefCartel.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
