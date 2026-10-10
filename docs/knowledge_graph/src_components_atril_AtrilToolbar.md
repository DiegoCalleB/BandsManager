---
id: src_components_atril_AtrilToolbar
title: "src/components/atril/AtrilToolbar.tsx"
layer: frontend
domain: repertoire
file: "src/components/atril/AtrilToolbar.tsx"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/atril/AtrilToolbar.tsx

> **Ubicación:** `src/components/atril/AtrilToolbar.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Barra de controles: transposición, notación, audio, bucle, autoscroll y herramientas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_atril_AtrilContext|src/components/atril/AtrilContext.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_chords_ControlAutoscroll|src/components/chords/ControlAutoscroll.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_chords_ControlBucle|src/components/chords/ControlBucle.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_chords_ControlMetronomo|src/components/chords/ControlMetronomo.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_chords_ControlTonoAudio|src/components/chords/ControlTonoAudio.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_chords_ControlVelocidad|src/components/chords/ControlVelocidad.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_chords_GrabarIdea|src/components/chords/GrabarIdea.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_chords_IrisStudio|src/components/chords/IrisStudio.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_chords_MezclaPistas|src/components/chords/MezclaPistas.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_chords_SelectorEscucha|src/components/chords/SelectorEscucha.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_chords_TomasConFondo|src/components/chords/TomasConFondo.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_utils_ideaDeAtril|src/utils/ideaDeAtril.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_irisTracks|src/utils/irisTracks.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_atril_AtrilView|src/components/atril/AtrilView.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
