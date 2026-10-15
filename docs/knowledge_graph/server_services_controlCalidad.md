---
id: server_services_controlCalidad
title: "server/services/controlCalidad.ts"
layer: service
domain: system
file: "server/services/controlCalidad.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/controlCalidad.ts

> **Ubicación:** `server/services/controlCalidad.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Mide un clip renderizado con ffmpeg y lo juzga con `evaluarCalidadClip`. Una sola pasada de

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[ext_ffmpeg|FFmpeg]] *(Layer: #external, Domain: #system)*
- [[server_utils_controlCalidadClip|server/utils/controlCalidadClip.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_clipNovedades|server/services/clipNovedades.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/controlCalidad.ffmpeg.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
