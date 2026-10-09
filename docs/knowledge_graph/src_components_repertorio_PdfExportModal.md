---
id: src_components_repertorio_PdfExportModal
title: "src/components/repertorio/PdfExportModal.tsx"
layer: frontend
domain: system
file: "src/components/repertorio/PdfExportModal.tsx"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/repertorio/PdfExportModal.tsx

> **Ubicación:** `src/components/repertorio/PdfExportModal.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: SetlistStylePreset, PdfExportModal.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_bands|server/routes/bands.ts]] *(Layer: #route, Domain: #system)*
- [[src_components_common_ModalPortal|src/components/common/ModalPortal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_MemberNotesModal|src/components/repertorio/MemberNotesModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_escapeHtml|src/utils/escapeHtml.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_printSettings|src/utils/printSettings.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_qrSvg|src/utils/qrSvg.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_repertorioUtils|src/utils/repertorioUtils.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_setlistNoteText|src/utils/setlistNoteText.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_setlistPaginator|src/utils/setlistPaginator.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_textFit|src/utils/textFit.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_RepertorioModalsContainer|src/components/repertorio/RepertorioModalsContainer.tsx]] *(from #frontend)*
- [[ui_repertoire_setlists|Repertorio & Setlists]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
