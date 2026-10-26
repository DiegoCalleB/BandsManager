---
id: server_utils_erroresSubida
title: "server/utils/erroresSubida.ts"
layer: service
domain: system
file: "server/utils/erroresSubida.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/erroresSubida.ts

> **Ubicación:** `server/utils/erroresSubida.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Mensajes de `/api/upload` que ve la persona usuaria (salen tal cual en el aviso de «No se pudo guardar el cambio»).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_upload|server/routes/upload.ts]] *(Layer: #route, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_upload|server/routes/upload.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/erroresSubida.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
