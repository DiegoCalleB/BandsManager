---
id: server_services_musicPreviewService
title: "server/services/musicPreviewService.ts"
layer: service
domain: system
file: "server/services/musicPreviewService.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/musicPreviewService.ts

> **Ubicación:** `server/services/musicPreviewService.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Previews de 30 s de una banda, vía la API pública de Deezer (sin clave).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_musicPreview|server/utils/musicPreview.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_bandMusic|server/routes/bandMusic.ts]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
