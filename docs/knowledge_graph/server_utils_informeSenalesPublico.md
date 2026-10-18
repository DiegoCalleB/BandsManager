---
id: server_utils_informeSenalesPublico
title: "server/utils/informeSenalesPublico.ts"
layer: service
domain: system
file: "server/utils/informeSenalesPublico.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/informeSenalesPublico.ts

> **Ubicación:** `server/utils/informeSenalesPublico.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Informe de las señales de público de un vídeo, a partir de lo que devuelven yt-dlp

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_services_comentariosYoutube|server/services/comentariosYoutube.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_senalesPublico|server/utils/senalesPublico.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_viralSignals|server/utils/viralSignals.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_youtubeSource|server/utils/youtubeSource.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/informeSenalesPublico.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
