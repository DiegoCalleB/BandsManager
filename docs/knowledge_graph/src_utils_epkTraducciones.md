---
id: src_utils_epkTraducciones
title: "src/utils/epkTraducciones.ts"
layer: service
domain: epk
file: "src/utils/epkTraducciones.ts"
tags: ["service", "epk", "auto"]
---

# 📌 src/utils/epkTraducciones.ts

> **Ubicación:** `src/utils/epkTraducciones.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/epk`

## 📖 Descripción
Exporta: IDIOMA_ORIGEN, CLAVES_DATOS_TRADUCIBLES, ClaveDatoTraducible, TextosTraducibles, recopilarTextosTraducibles, hayAlgoQueTraducir, calcularHashFuente, traduccionDesactualizada.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_epk_fans|server/routes/epk_fans.ts]] *(from #route)*
- [[src_components_epk_epkBlocks|src/components/epk/epkBlocks.ts]] *(from #frontend)*
- [[src_components_epk_EPKDonacionesBlock|src/components/epk/EPKDonacionesBlock.tsx]] *(from #frontend)*
- [[src_components_EPKManager|src/components/EPKManager.tsx]] *(from #frontend)*
- [[src_components_PublicEPK|src/components/PublicEPK.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
