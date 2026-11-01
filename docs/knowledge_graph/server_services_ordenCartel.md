---
id: server_services_ordenCartel
title: "server/services/ordenCartel.ts"
layer: service
domain: system
file: "server/services/ordenCartel.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/ordenCartel.ts

> **Ubicación:** `server/services/ordenCartel.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
«Pídele cambios al cartel»: una frase libre → un plan con dos mitades. Lo de la ILUSTRACIÓN (escena, luz, colores

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_ai|server/ai.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_ordenes|src/utils/cartel/ordenes.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_cartelria|server/routes/cartelria.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/ordenCartel.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
