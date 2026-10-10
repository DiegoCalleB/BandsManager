---
id: src_components_Atril
title: "src/components/Atril.tsx"
layer: frontend
domain: repertoire
file: "src/components/Atril.tsx"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/Atril.tsx

> **Ubicación:** `src/components/Atril.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Atril: cifrado, audio, estructura y herramientas de estudio de un tema.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_atril_AtrilProvider|src/components/atril/AtrilProvider.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_atril_AtrilView|src/components/atril/AtrilView.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_atril_chordSheetRender|src/components/atril/chordSheetRender.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_atril_hooks_useAtrilController|src/components/atril/hooks/useAtrilController.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_modosAtril|src/utils/modosAtril.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_repertorio_setlists|Repertorio y setlists]] *(from #feature)*
- [[src_components_atril_AtrilContext|src/components/atril/AtrilContext.ts]] *(from #frontend)*
- [[src_components_atril_hooks_useAtrilController|src/components/atril/hooks/useAtrilController.ts]] *(from #frontend)*
- [[src_components_ensayos_ModoLocalEnVivoTab|src/components/ensayos/ModoLocalEnVivoTab.tsx]] *(from #frontend)*
- [[src_components_repertorio_RepertorioModalsContainer|src/components/repertorio/RepertorioModalsContainer.tsx]] *(from #frontend)*
- [[src_components_song_studio_SongStudioDialogs|src/components/song_studio/SongStudioDialogs.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/audit/acordesSobreTexto.test.tsx`
- `src/components/atril/__tests__/atrilContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
