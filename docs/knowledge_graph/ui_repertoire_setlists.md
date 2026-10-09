---
id: ui_repertoire_setlists
title: "Repertorio & Setlists"
layer: frontend
domain: repertoire
file: "src/components/RepertorioSetlists.tsx"
tags: ["ui", "repertoire", "audio"]
---

# 📌 Repertorio & Setlists

> **Ubicación:** `src/components/RepertorioSetlists.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Gestión de canciones, directos, compatibilidad tonal y transiciones armónicas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[db_repertoire|Repertoire DB Handlers]] *(Layer: #db, Domain: #repertoire)*
- [[route_repertoire|Repertoire & Setlists Route]] *(Layer: #route, Domain: #repertoire)*
- [[src_components_repertorio_RepertorioCatalogView|src/components/repertorio/RepertorioCatalogView.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_RepertorioModalsContainer|src/components/repertorio/RepertorioModalsContainer.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_RepertorioNavBar|src/components/repertorio/RepertorioNavBar.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_RepertorioSetlistsView|src/components/repertorio/RepertorioSetlistsView.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_SetlistAIAnalysisModal|src/components/repertorio/SetlistAIAnalysisModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_hooks_useActiveSetlistState|src/components/repertorio/hooks/useActiveSetlistState.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_hooks_useCatalogActions|src/components/repertorio/hooks/useCatalogActions.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_hooks_useEnergyMapData|src/components/repertorio/hooks/useEnergyMapData.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_hooks_useRepertorioData|src/components/repertorio/hooks/useRepertorioData.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_hooks_useRepertorioDialogs|src/components/repertorio/hooks/useRepertorioDialogs.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_hooks_useRepertorioPersistence|src/components/repertorio/hooks/useRepertorioPersistence.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_hooks_useRepertorioPlaybackAndModals|src/components/repertorio/hooks/useRepertorioPlaybackAndModals.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_hooks_useRepertorioViewState|src/components/repertorio/hooks/useRepertorioViewState.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_hooks_useSetlistCrud|src/components/repertorio/hooks/useSetlistCrud.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_hooks_useSetlistDeletion|src/components/repertorio/hooks/useSetlistDeletion.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_hooks_useSetlistItemActions|src/components/repertorio/hooks/useSetlistItemActions.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_hooks_useSetlistItemPopovers|src/components/repertorio/hooks/useSetlistItemPopovers.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_hooks_useSetlistItemsMutations|src/components/repertorio/hooks/useSetlistItemsMutations.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_hooks_useSetlistReordering|src/components/repertorio/hooks/useSetlistReordering.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_hooks_useSetlistSync|src/components/repertorio/hooks/useSetlistSync.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_components_repertorio_hooks_useSongEditing|src/components/repertorio/hooks/useSongEditing.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_config_defaultRepertoire|src/config/defaultRepertoire.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_context_LanguageContext|src/context/LanguageContext.tsx]] *(Layer: #service, Domain: #system)*
- [[src_context_PlayerContext|src/context/PlayerContext.tsx]] *(Layer: #service, Domain: #system)*
- [[src_hooks_useAudioPlayer|src/hooks/useAudioPlayer.ts]] *(Layer: #hook, Domain: #repertoire)*
- [[src_hooks_useCatalogFilters|src/hooks/useCatalogFilters.ts]] *(Layer: #hook, Domain: #system)*
- [[src_hooks_useModuleTutorial|src/hooks/useModuleTutorial.ts]] *(Layer: #hook, Domain: #system)*
- [[src_hooks_useRepertorioTabs|src/hooks/useRepertorioTabs.ts]] *(Layer: #hook, Domain: #system)*
- [[src_hooks_useShareModal|src/hooks/useShareModal.ts]] *(Layer: #hook, Domain: #system)*
- [[src_hooks_useStagePlayer|src/hooks/useStagePlayer.ts]] *(Layer: #hook, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_repertorioUtils|src/utils/repertorioUtils.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_stageTimeFormat|src/utils/stageTimeFormat.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_repertorio_setlists|Repertorio y setlists]] *(from #feature)*
- [[src_App|src/App.tsx]] *(from #frontend)*
- [[src_components_repertorio_EscenarioView|src/components/repertorio/EscenarioView.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/repertorio/__tests__/repertorioModulesContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
