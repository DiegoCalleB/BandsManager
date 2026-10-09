---
id: server_utils_analisisAcordes
title: "server/utils/analisisAcordes.ts"
layer: service
domain: system
file: "server/utils/analisisAcordes.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/analisisAcordes.ts

> **Ubicación:** `server/utils/analisisAcordes.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: VERSION_ANALISIS_ACORDES, normalizarTonalidad, FuenteAudioAcordes, elegirFuenteAudio, FuentesAudioAcordes, elegirFuentesAudio, motivoAnalisisPocoFiable, construirAnalisis.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_repertoire|Repertoire & Setlists Route]] *(from #route)*
- [[server_services_acordesCancion|server/services/acordesCancion.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/analisisAcordes.test.ts`
- `server/utils/__tests__/chordDetection.realista.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
