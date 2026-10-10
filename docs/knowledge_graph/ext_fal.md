---
id: ext_fal
title: "fal.ai"
layer: external
domain: system
file: "servicio externo"
tags: ["external", "auto"]
---

# 📌 fal.ai

> **Ubicación:** `servicio externo`  
> **Capa:** `#layer/external` | **Dominio:** `#domain/system`

## 📖 Descripción
Separación de pistas en la nube.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_iris_estudio|Estudio de canción e Iris (stems)]] *(from #feature)*
- [[server_routes_ai_music|server/routes/ai_music.ts]] *(from #route)*
- [[server_services_audioSeparator_AudioSeparatorFactory|server/services/audioSeparator/AudioSeparatorFactory.ts]] *(from #service)*
- [[server_services_audioSeparator_FalAiService|server/services/audioSeparator/FalAiService.ts]] *(from #service)*
- [[server_services_audioSeparator_index|server/services/audioSeparator/index.ts]] *(from #service)*
- [[src_utils_separacionIris|src/utils/separacionIris.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
