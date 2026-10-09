---
id: server_services_acordesCancion
title: "server/services/acordesCancion.ts"
layer: service
domain: system
file: "server/services/acordesCancion.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/acordesCancion.ts

> **Ubicación:** `server/services/acordesCancion.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: ResultadoAnalisis, analizarAcordesDeCancion.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_analisisAcordes|server/utils/analisisAcordes.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_audioKey|server/utils/audioKey.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_utils_chordDetection|server/utils/chordDetection.ts]] *(Layer: #service, Domain: #repertoire)*
- [[server_utils_pulso|server/utils/pulso.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_repertoire|Repertoire & Setlists Route]] *(from #route)*
- [[server_services_letraCancion|server/services/letraCancion.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
