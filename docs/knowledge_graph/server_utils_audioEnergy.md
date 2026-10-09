---
id: server_utils_audioEnergy
title: "server/utils/audioEnergy.ts"
layer: service
domain: repertoire
file: "server/utils/audioEnergy.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 server/utils/audioEnergy.ts

> **Ubicación:** `server/utils/audioEnergy.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Curva de energía del audio para elegir highlights.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[sec_ssrf_guard|SSRF URL Validator]] *(Layer: #security, Domain: #system)*
- [[server_utils_youtubeSource|server/utils/youtubeSource.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[db_repertoire|Repertoire DB Handlers]] *(from #db)*
- [[server_routes_ai_music|server/routes/ai_music.ts]] *(from #route)*
- [[server_routes_concert_to_album|server/routes/concert_to_album.ts]] *(from #route)*
- [[server_routes_reels|server/routes/reels.ts]] *(from #route)*
- [[server_utils_audioKey|server/utils/audioKey.ts]] *(from #service)*
- [[server_utils_viralSignals|server/utils/viralSignals.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/reelsRoute.test.ts`
- `server/utils/__tests__/audioEnergy.test.ts`
- `server/utils/__tests__/viralSignals.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
