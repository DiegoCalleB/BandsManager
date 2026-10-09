---
id: server_utils_chordDetection
title: "server/utils/chordDetection.ts"
layer: service
domain: repertoire
file: "server/utils/chordDetection.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 server/utils/chordDetection.ts

> **Ubicación:** `server/utils/chordDetection.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Detección de acordes con tiempos a partir de audio (el motor de un «Chordify propio»).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_audioKey|server/utils/audioKey.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_utils_refinarFronteras|server/utils/refinarFronteras.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_acordesCancion|server/services/acordesCancion.ts]] *(from #service)*
- [[server_utils_refinarFronteras|server/utils/refinarFronteras.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/analisisAcordes.test.ts`
- `server/utils/__tests__/chordDetection.realista.test.ts`
- `server/utils/__tests__/chordDetection.test.ts`
- `server/utils/__tests__/refinarFronteras.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
