---
id: src_components_EPKManager
title: "src/components/EPKManager.tsx"
layer: frontend
domain: epk
file: "src/components/EPKManager.tsx"
tags: ["frontend", "epk", "auto"]
---

# 📌 src/components/EPKManager.tsx

> **Ubicación:** `src/components/EPKManager.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/epk`

## 📖 Descripción
Exporta: EPKManager.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_FansLandingPreviewModal|src/components/FansLandingPreviewModal.tsx]] *(Layer: #frontend, Domain: #social)*
- [[src_components_common_ModuleTutorialModal|src/components/common/ModuleTutorialModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_epk_EPKArchivosBlock|src/components/epk/EPKArchivosBlock.tsx]] *(Layer: #frontend, Domain: #epk)*
- [[src_components_epk_EPKDonacionesBlock|src/components/epk/EPKDonacionesBlock.tsx]] *(Layer: #frontend, Domain: #epk)*
- [[src_components_epk_EPKFirmaQRBlock|src/components/epk/EPKFirmaQRBlock.tsx]] *(Layer: #frontend, Domain: #epk)*
- [[src_components_epk_EPKHeader|src/components/epk/EPKHeader.tsx]] *(Layer: #frontend, Domain: #epk)*
- [[src_components_epk_EPKMusicaBlock|src/components/epk/EPKMusicaBlock.tsx]] *(Layer: #frontend, Domain: #epk)*
- [[src_components_epk_EPKPerfilBlock|src/components/epk/EPKPerfilBlock.tsx]] *(Layer: #frontend, Domain: #epk)*
- [[src_components_epk_EPKPlantillasBlock|src/components/epk/EPKPlantillasBlock.tsx]] *(Layer: #frontend, Domain: #epk)*
- [[src_components_epk_EPKPrensaBlock|src/components/epk/EPKPrensaBlock.tsx]] *(Layer: #frontend, Domain: #epk)*
- [[src_components_epk_epkBlocks|src/components/epk/epkBlocks.ts]] *(Layer: #frontend, Domain: #epk)*
- [[src_hooks_useModuleTutorial|src/hooks/useModuleTutorial.ts]] *(Layer: #hook, Domain: #system)*
- [[src_i18n_epkTranslations|src/i18n/epkTranslations.ts]] *(Layer: #service, Domain: #epk)*
- [[src_services_api|src/services/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_bandHash|src/utils/bandHash.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_epkTraducciones|src/utils/epkTraducciones.ts]] *(Layer: #service, Domain: #epk)*
- [[src_utils_epkVerificacion|src/utils/epkVerificacion.ts]] *(Layer: #service, Domain: #epk)*
- [[src_utils_planPermissions|src/utils/planPermissions.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_fans_epk|Fans y EPK]] *(from #feature)*
- [[src_app_lazyViews|src/app/lazyViews.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
