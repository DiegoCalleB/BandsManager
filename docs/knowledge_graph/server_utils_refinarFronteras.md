---
id: server_utils_refinarFronteras
title: "server/utils/refinarFronteras.ts"
layer: service
domain: system
file: "server/utils/refinarFronteras.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/refinarFronteras.ts

> **Ubicación:** `server/utils/refinarFronteras.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Afina los cambios de acorde con los ataques del audio.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_audioKey|server/utils/audioKey.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_utils_chordDetection|server/utils/chordDetection.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_utils_chordDetection|server/utils/chordDetection.ts]] *(from #service)*
- [[server_utils_pulso|server/utils/pulso.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/refinarFronteras.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
