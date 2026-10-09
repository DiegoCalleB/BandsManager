---
id: src_utils_irisTracks
title: "src/utils/irisTracks.ts"
layer: service
domain: repertoire
file: "src/utils/irisTracks.ts"
tags: ["service", "repertoire", "auto"]
---

# 📌 src/utils/irisTracks.ts

> **Ubicación:** `src/utils/irisTracks.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Exporta: getSongIrisStemIdea, esIdeaIris, irisPrimero, hasIrisStems, getIdeaTracks, pistasDeIdeas, metaStemsDeIdeas, pistasDeCancion.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[db_repertoire|Repertoire DB Handlers]] *(from #db)*
- [[route_repertoire|Repertoire & Setlists Route]] *(from #route)*
- [[server_services_letraCancion|server/services/letraCancion.ts]] *(from #service)*
- [[src_components_Atril|src/components/Atril.tsx]] *(from #frontend)*
- [[src_components_repertorio_SongCardRow|src/components/repertorio/SongCardRow.tsx]] *(from #frontend)*
- [[src_components_SetlistPerformanceView|src/components/SetlistPerformanceView.tsx]] *(from #frontend)*
- [[src_components_SongStudioModal|src/components/SongStudioModal.tsx]] *(from #frontend)*
- [[src_hooks_useIdeaComments|src/hooks/useIdeaComments.ts]] *(from #hook)*
- [[src_hooks_useSeparacionIris|src/hooks/useSeparacionIris.ts]] *(from #hook)*
- [[src_utils_ideaDeAtril|src/utils/ideaDeAtril.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
