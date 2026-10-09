---
id: server_utils_audioKey
title: "server/utils/audioKey.ts"
layer: service
domain: repertoire
file: "server/utils/audioKey.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 server/utils/audioKey.ts

> **Ubicación:** `server/utils/audioKey.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Detección de tonalidad (tono/clave musical) desde audio.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_audioEnergy|server/utils/audioEnergy.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[db_repertoire|Repertoire DB Handlers]] *(from #db)*
- [[server_services_acordesCancion|server/services/acordesCancion.ts]] *(from #service)*
- [[server_utils_chordDetection|server/utils/chordDetection.ts]] *(from #service)*
- [[server_utils_refinarFronteras|server/utils/refinarFronteras.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/audioKey.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
