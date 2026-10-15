---
id: src_components_repertorio_pdf_export_printDocumentBuilder
title: "src/components/repertorio/pdf_export/printDocumentBuilder.ts"
layer: frontend
domain: system
file: "src/components/repertorio/pdf_export/printDocumentBuilder.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/repertorio/pdf_export/printDocumentBuilder.ts

> **Ubicación:** `src/components/repertorio/pdf_export/printDocumentBuilder.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: PrintDocumentBuilderParams, buildPrintDocument.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_repertorio_pdf_export_buildHeaderFooter|src/components/repertorio/pdf_export/buildHeaderFooter.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_pdf_export_buildPrintScripts|src/components/repertorio/pdf_export/buildPrintScripts.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_pdf_export_buildPrintStyles|src/components/repertorio/pdf_export/buildPrintStyles.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_pdf_export_buildRowHtmlFactory|src/components/repertorio/pdf_export/buildRowHtmlFactory.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_pdf_export_printLayout|src/components/repertorio/pdf_export/printLayout.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_escapeHtml|src/utils/escapeHtml.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_repertorioUtils|src/utils/repertorioUtils.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_setlistNoteText|src/utils/setlistNoteText.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_setlistPaginator|src/utils/setlistPaginator.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_textFit|src/utils/textFit.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_pdf_export_hooks_usePrintPreview|src/components/repertorio/pdf_export/hooks/usePrintPreview.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
