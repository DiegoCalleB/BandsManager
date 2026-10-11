---
id: src_components_repertorio_pdf_export_PdfExportContext
title: "src/components/repertorio/pdf_export/PdfExportContext.ts"
layer: frontend
domain: system
file: "src/components/repertorio/pdf_export/PdfExportContext.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/repertorio/pdf_export/PdfExportContext.ts

> **Ubicación:** `src/components/repertorio/pdf_export/PdfExportContext.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Contexto del exportador PDF: reparte estado y acciones del controlador a las vistas del modal.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_repertorio_pdf_export_hooks_usePdfExportController|src/components/repertorio/pdf_export/hooks/usePdfExportController.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_repertorioUtils|src/utils/repertorioUtils.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_pdf_export_AdvancedSettingsToggle|src/components/repertorio/pdf_export/AdvancedSettingsToggle.tsx]] *(from #frontend)*
- [[src_components_repertorio_pdf_export_MemberNotesHost|src/components/repertorio/pdf_export/MemberNotesHost.tsx]] *(from #frontend)*
- [[src_components_repertorio_pdf_export_ModeAndTargetRow|src/components/repertorio/pdf_export/ModeAndTargetRow.tsx]] *(from #frontend)*
- [[src_components_repertorio_pdf_export_PdfControlPanel|src/components/repertorio/pdf_export/PdfControlPanel.tsx]] *(from #frontend)*
- [[src_components_repertorio_pdf_export_PdfExportHeader|src/components/repertorio/pdf_export/PdfExportHeader.tsx]] *(from #frontend)*
- [[src_components_repertorio_pdf_export_PdfExportLayout|src/components/repertorio/pdf_export/PdfExportLayout.tsx]] *(from #frontend)*
- [[src_components_repertorio_pdf_export_PdfExportProvider|src/components/repertorio/pdf_export/PdfExportProvider.tsx]] *(from #frontend)*
- [[src_components_repertorio_pdf_export_SheetPager|src/components/repertorio/pdf_export/SheetPager.tsx]] *(from #frontend)*
- [[src_components_repertorio_pdf_export_SheetPreviewPane|src/components/repertorio/pdf_export/SheetPreviewPane.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/repertorio/pdf_export/__tests__/pdfExportContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
