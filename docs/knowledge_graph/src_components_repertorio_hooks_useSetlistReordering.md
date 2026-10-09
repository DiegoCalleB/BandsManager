---
id: src_components_repertorio_hooks_useSetlistReordering
title: "src/components/repertorio/hooks/useSetlistReordering.ts"
layer: frontend
domain: repertoire
file: "src/components/repertorio/hooks/useSetlistReordering.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/repertorio/hooks/useSetlistReordering.ts

> **Ubicación:** `src/components/repertorio/hooks/useSetlistReordering.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Reordenación y optimización del setlist activo: deshacer, sugerencia de chapa, plan de Setlist Perfecto y drag and drop.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_repertorio_PerfectSetlistModal|src/components/repertorio/PerfectSetlistModal.tsx]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_services_api|src/services/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
