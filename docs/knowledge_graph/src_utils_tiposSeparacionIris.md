---
id: src_utils_tiposSeparacionIris
title: "src/utils/tiposSeparacionIris.ts"
layer: service
domain: repertoire
file: "src/utils/tiposSeparacionIris.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 src/utils/tiposSeparacionIris.ts

> **Ubicación:** `src/utils/tiposSeparacionIris.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Respuestas y errores de `/api/ai-stem-separation` que leen `separacionIris.ts` y `useSeparacionIris`.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_ai_music_rutaSeparacion|server/routes/ai_music/rutaSeparacion.ts]] *(Layer: #route, Domain: #system)*
- [[src_utils_separacionIris|src/utils/separacionIris.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_hooks_useSeparacionIris|src/hooks/useSeparacionIris.ts]] *(from #hook)*
- [[src_utils_separacionIris|src/utils/separacionIris.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
