---
id: server_utils_rejillaBeats
title: "server/utils/rejillaBeats.ts"
layer: service
domain: system
file: "server/utils/rejillaBeats.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/rejillaBeats.ts

> **Ubicación:** `server/utils/rejillaBeats.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Rejilla de pulsos y compases de un tramo, para montar al ritmo real de la canción.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_ffmpeg|FFmpeg]] *(Layer: #external, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_clipNovedades|server/services/clipNovedades.ts]] *(from #service)*
- [[server_utils_clipFiltros|server/utils/clipFiltros.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/rejillaBeats.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
