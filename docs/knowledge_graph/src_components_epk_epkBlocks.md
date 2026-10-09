---
id: src_components_epk_epkBlocks
title: "src/components/epk/epkBlocks.ts"
layer: frontend
domain: epk
file: "src/components/epk/epkBlocks.ts"
tags: ["frontend", "epk", "auto"]
---

# 📌 src/components/epk/epkBlocks.ts

> **Ubicación:** `src/components/epk/epkBlocks.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/epk`

## 📖 Descripción
Exporta: EPKBlockId, EPKBlockMeta, EPK_BLOCKS, EPKHealthStats, computeEPKHealth, getBlockNavigation, UNIFIED_PLATFORMS.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_epkTraducciones|src/utils/epkTraducciones.ts]] *(Layer: #service, Domain: #epk)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_epk_EPKArchivosBlock|src/components/epk/EPKArchivosBlock.tsx]] *(from #frontend)*
- [[src_components_epk_EPKBlockWrapper|src/components/epk/EPKBlockWrapper.tsx]] *(from #frontend)*
- [[src_components_epk_EPKDonacionesBlock|src/components/epk/EPKDonacionesBlock.tsx]] *(from #frontend)*
- [[src_components_epk_EPKFirmaQRBlock|src/components/epk/EPKFirmaQRBlock.tsx]] *(from #frontend)*
- [[src_components_epk_EPKHeader|src/components/epk/EPKHeader.tsx]] *(from #frontend)*
- [[src_components_epk_EPKMusicaBlock|src/components/epk/EPKMusicaBlock.tsx]] *(from #frontend)*
- [[src_components_epk_EPKPerfilBlock|src/components/epk/EPKPerfilBlock.tsx]] *(from #frontend)*
- [[src_components_epk_EPKPlantillasBlock|src/components/epk/EPKPlantillasBlock.tsx]] *(from #frontend)*
- [[src_components_epk_EPKPrensaBlock|src/components/epk/EPKPrensaBlock.tsx]] *(from #frontend)*
- [[src_components_EPKManager|src/components/EPKManager.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
