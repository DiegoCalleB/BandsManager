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
Modal de exportación del setlist a PDF/impresión: ajustes de diseño, vista previa paginada y hojas por miembro.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_repertorio_pdf_export_PdfExportLayout|src/components/repertorio/pdf_export/PdfExportLayout.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_pdf_export_PdfExportProvider|src/components/repertorio/pdf_export/PdfExportProvider.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_pdf_export_hooks_usePdfExportController|src/components/repertorio/pdf_export/hooks/usePdfExportController.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_pdf_export_printLayout|src/components/repertorio/pdf_export/printLayout.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_repertorioUtils|src/utils/repertorioUtils.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_RepertorioModalsContainer|src/components/repertorio/RepertorioModalsContainer.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/repertorio/pdf_export/__tests__/pdfExportContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
