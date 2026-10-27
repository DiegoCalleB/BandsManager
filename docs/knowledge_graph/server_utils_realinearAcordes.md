---
id: server_utils_realinearAcordes
title: "server/utils/realinearAcordes.ts"
layer: service
domain: system
file: "server/utils/realinearAcordes.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/realinearAcordes.ts

> **Ubicación:** `server/utils/realinearAcordes.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Coloca cada cambio de acorde donde la armonía cambia de verdad.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_audioKey|server/utils/audioKey.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_utils_chordDetection|server/utils/chordDetection.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_utils_refinarFronteras|server/utils/refinarFronteras.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_utils_chordDetection|server/utils/chordDetection.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/realinearAcordes.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
