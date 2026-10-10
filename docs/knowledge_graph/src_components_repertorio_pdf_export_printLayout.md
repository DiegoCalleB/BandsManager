---
id: src_components_repertorio_pdf_export_printLayout
title: "src/components/repertorio/pdf_export/printLayout.ts"
layer: frontend
domain: system
file: "src/components/repertorio/pdf_export/printLayout.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/repertorio/pdf_export/printLayout.ts

> **Ubicación:** `src/components/repertorio/pdf_export/printLayout.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Constantes y cálculo de maquetación de la hoja impresa del setlist (márgenes, columnas, tipografías y nota por canción).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_textFit|src/utils/textFit.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_pdf_export_buildPrintScripts|src/components/repertorio/pdf_export/buildPrintScripts.ts]] *(from #frontend)*
- [[src_components_repertorio_pdf_export_buildPrintStyles|src/components/repertorio/pdf_export/buildPrintStyles.ts]] *(from #frontend)*
- [[src_components_repertorio_pdf_export_buildRowHtmlFactory|src/components/repertorio/pdf_export/buildRowHtmlFactory.ts]] *(from #frontend)*
- [[src_components_repertorio_pdf_export_hooks_usePrintPreview|src/components/repertorio/pdf_export/hooks/usePrintPreview.ts]] *(from #frontend)*
- [[src_components_repertorio_pdf_export_hooks_usePrintSettings|src/components/repertorio/pdf_export/hooks/usePrintSettings.ts]] *(from #frontend)*
- [[src_components_repertorio_pdf_export_ModeAndTargetRow|src/components/repertorio/pdf_export/ModeAndTargetRow.tsx]] *(from #frontend)*
- [[src_components_repertorio_pdf_export_printDocumentBuilder|src/components/repertorio/pdf_export/printDocumentBuilder.ts]] *(from #frontend)*
- [[src_components_repertorio_PdfExportModal|src/components/repertorio/PdfExportModal.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/repertorio/pdf_export/__tests__/printLayout.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
