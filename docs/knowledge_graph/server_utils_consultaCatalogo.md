---
id: server_utils_consultaCatalogo
title: "server/utils/consultaCatalogo.ts"
layer: service
domain: system
file: "server/utils/consultaCatalogo.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/consultaCatalogo.ts

> **Ubicación:** `server/utils/consultaCatalogo.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Consulta del catálogo compartido de salas (fase 2): reglas puras, sin base de datos.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_services_catalogoSalas|server/services/catalogoSalas.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_salaCatalogo|server/utils/salaCatalogo.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_chatCatalogo|server/services/chatCatalogo.ts]] *(from #service)*
- [[server_services_chatLecturas|server/services/chatLecturas.ts]] *(from #service)*
- [[server_services_consultaCatalogo|server/services/consultaCatalogo.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/chatCatalogo.test.ts`
- `server/utils/__tests__/consultaCatalogo.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
