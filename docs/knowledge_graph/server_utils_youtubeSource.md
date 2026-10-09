---
id: server_utils_youtubeSource
title: "server/utils/youtubeSource.ts"
layer: service
domain: system
file: "server/utils/youtubeSource.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/youtubeSource.ts

> **Ubicación:** `server/utils/youtubeSource.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: ejecutar, COOKIES_FILE, banderasDeCookies, banderasAntiBot, rutaYtDlp, ytDlpDisponible, _resetYtDlpCache, CapituloVideo.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_ffmpeg|FFmpeg]] *(Layer: #external, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_concert_to_album|server/routes/concert_to_album.ts]] *(from #route)*
- [[server_routes_reels|server/routes/reels.ts]] *(from #route)*
- [[server_utils_audioEnergy|server/utils/audioEnergy.ts]] *(from #service)*
- [[server_utils_viralSignals|server/utils/viralSignals.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/reelsRoute.test.ts`
- `server/utils/__tests__/youtubeSource.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
