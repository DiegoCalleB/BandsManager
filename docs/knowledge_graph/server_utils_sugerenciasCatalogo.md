---
id: server_utils_sugerenciasCatalogo
title: "server/utils/sugerenciasCatalogo.ts"
layer: service
domain: system
file: "server/utils/sugerenciasCatalogo.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/sugerenciasCatalogo.ts

> **Ubicación:** `server/utils/sugerenciasCatalogo.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Sugerencias del catálogo compartido para una banda nueva (fase 3): reglas puras.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_services_catalogoSalas|server/services/catalogoSalas.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_consultaCatalogo|server/utils/consultaCatalogo.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_salaCatalogo|server/utils/salaCatalogo.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_consultaCatalogo|server/services/consultaCatalogo.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/sugerenciasCatalogo.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
