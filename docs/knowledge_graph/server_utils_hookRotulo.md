---
id: server_utils_hookRotulo
title: "server/utils/hookRotulo.ts"
layer: service
domain: system
file: "server/utils/hookRotulo.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/hookRotulo.ts

> **Ubicación:** `server/utils/hookRotulo.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Rótulo de enganche de los primeros segundos de un Reel, como capa ASS.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_reelsCore|server/utils/reelsCore.ts]] *(Layer: #service, Domain: #social)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_clipNovedades|server/services/clipNovedades.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/clipFiltros.ffmpeg.test.ts`
- `server/utils/__tests__/clipFiltros.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
