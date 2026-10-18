---
id: src_utils_sonarAcorde
title: "src/utils/sonarAcorde.ts"
layer: service
domain: system
file: "src/utils/sonarAcorde.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/sonarAcorde.ts

> **Ubicación:** `src/utils/sonarAcorde.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Hace sonar un acorde del Atril tal y como lo dibuja el diagrama (misma inversión), con la canción atenuada un momento.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_ducking|src/utils/ducking.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_inversiones|src/utils/inversiones.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_vistaAcordes|src/utils/vistaAcordes.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_voicings|src/utils/voicings.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_chords_AcordeEnInstrumento|src/components/chords/AcordeEnInstrumento.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/audit/sonarAcorde.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
