---
id: server_services_clipRenderer
title: "server/services/clipRenderer.ts"
layer: service
domain: system
file: "server/services/clipRenderer.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/clipRenderer.ts

> **Ubicación:** `server/services/clipRenderer.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Renderiza un clip vertical con ffmpeg a partir de un vídeo ya descargado.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_ffmpeg|FFmpeg]] *(Layer: #external, Domain: #system)*
- [[server_utils_clipFiltros|server/utils/clipFiltros.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_reels|server/routes/reels.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
