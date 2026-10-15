---
id: server_utils_enlacesPublicos
title: "server/utils/enlacesPublicos.ts"
layer: service
domain: system
file: "server/utils/enlacesPublicos.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/enlacesPublicos.ts

> **Ubicación:** `server/utils/enlacesPublicos.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
`enlacesRedes` del EPK mezcla dos cosas: enlaces públicos (instagram, spotify, web…) y la

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_epk_fans|server/routes/epk_fans.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/enlacesPublicos.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
