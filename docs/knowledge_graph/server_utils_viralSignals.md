---
id: server_utils_viralSignals
title: "server/utils/viralSignals.ts"
layer: service
domain: system
file: "server/utils/viralSignals.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/viralSignals.ts

> **Ubicación:** `server/utils/viralSignals.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Detección de los fragmentos con más potencial viral.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_audioEnergy|server/utils/audioEnergy.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_utils_youtubeSource|server/utils/youtubeSource.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_reels|server/routes/reels.ts]] *(from #route)*
- [[server_utils_reelStrategy|server/utils/reelStrategy.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
