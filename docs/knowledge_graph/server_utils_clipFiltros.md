---
id: server_utils_clipFiltros
title: "server/utils/clipFiltros.ts"
layer: service
domain: system
file: "server/utils/clipFiltros.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/clipFiltros.ts

> **Ubicación:** `server/utils/clipFiltros.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Plan de ffmpeg para un clip vertical: qué filtros y qué opciones de salida lleva.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_ffmpeg|FFmpeg]] *(Layer: #external, Domain: #system)*
- [[server_utils_reelsCore|server/utils/reelsCore.ts]] *(Layer: #service, Domain: #social)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_clipNovedades|server/services/clipNovedades.ts]] *(from #service)*
- [[server_services_clipRenderer|server/services/clipRenderer.ts]] *(from #service)*
- [[server_utils_loopPerfecto|server/utils/loopPerfecto.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/clipFiltros.ffmpeg.test.ts`
- `server/utils/__tests__/clipFiltros.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
