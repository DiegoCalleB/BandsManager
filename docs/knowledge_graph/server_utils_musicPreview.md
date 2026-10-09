---
id: server_utils_musicPreview
title: "server/utils/musicPreview.ts"
layer: service
domain: system
file: "server/utils/musicPreview.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/musicPreview.ts

> **Ubicación:** `server/utils/musicPreview.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Elección pura de artista y preview a partir de las respuestas de la API pública de Deezer

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_spotifyMatch|server/utils/spotifyMatch.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_musicPreviewService|server/services/musicPreviewService.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
