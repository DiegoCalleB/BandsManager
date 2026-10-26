---
id: server_utils_datosDeWebSala
title: "server/utils/datosDeWebSala.ts"
layer: service
domain: system
file: "server/utils/datosDeWebSala.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/datosDeWebSala.ts

> **Ubicación:** `server/utils/datosDeWebSala.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Datos de una sala que se pueden sacar de su propia web: reglas puras, sin red. Se aplican las reglas de privacidad del

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_instagramEnWeb|server/utils/instagramEnWeb.ts]] *(Layer: #service, Domain: #social)*
- [[server_utils_salaCatalogo|server/utils/salaCatalogo.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_catalogoScheduler|server/services/catalogoScheduler.ts]] *(from #service)*
- [[server_services_enriquecerSalasDesdeSuWeb|server/services/enriquecerSalasDesdeSuWeb.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/enriquecerSalasDesdeSuWeb.test.ts`
- `server/utils/__tests__/datosDeWebSala.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
