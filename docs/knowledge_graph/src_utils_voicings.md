---
id: src_utils_voicings
title: "src/utils/voicings.ts"
layer: service
domain: system
file: "src/utils/voicings.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/voicings.ts

> **Ubicación:** `src/utils/voicings.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: NivelAcorde, NIVELES, ETIQUETA_NIVEL, AYUDA_NIVEL, CUERDAS_GUITARRA, etiquetaIntervalo, NotaGuitarra, FormaGuitarra.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_vistaAcordes|src/utils/vistaAcordes.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_chords_AcordeActual|src/components/chords/AcordeActual.tsx]] *(from #frontend)*
- [[src_components_chords_AcordeEnInstrumento|src/components/chords/AcordeEnInstrumento.tsx]] *(from #frontend)*
- [[src_components_chords_DiagramaGuitarra|src/components/chords/DiagramaGuitarra.tsx]] *(from #frontend)*
- [[src_components_chords_DrawerDiagramas|src/components/chords/DrawerDiagramas.tsx]] *(from #frontend)*
- [[src_components_chords_PentagramaFicha|src/components/chords/PentagramaFicha.tsx]] *(from #frontend)*
- [[src_components_chords_useVistaAcordes|src/components/chords/useVistaAcordes.ts]] *(from #frontend)*
- [[src_utils_sonarAcorde|src/utils/sonarAcorde.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/voicings.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
