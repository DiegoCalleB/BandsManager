---
id: src_components_repertorio_pdf_export_hooks_usePdfExportController
title: "src/components/repertorio/pdf_export/hooks/usePdfExportController.ts"
layer: frontend
domain: system
file: "src/components/repertorio/pdf_export/hooks/usePdfExportController.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/repertorio/pdf_export/hooks/usePdfExportController.ts

> **Ubicación:** `src/components/repertorio/pdf_export/hooks/usePdfExportController.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Compone los hooks del exportador PDF (miembros, ajustes, marcas, persistencia y vista previa).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_repertorio_pdf_export_hooks_useMemberSelection|src/components/repertorio/pdf_export/hooks/useMemberSelection.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_pdf_export_hooks_usePrintMembers|src/components/repertorio/pdf_export/hooks/usePrintMembers.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_pdf_export_hooks_usePrintPreview|src/components/repertorio/pdf_export/hooks/usePrintPreview.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_pdf_export_hooks_usePrintSettings|src/components/repertorio/pdf_export/hooks/usePrintSettings.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_pdf_export_hooks_usePrintSettingsPersistence|src/components/repertorio/pdf_export/hooks/usePrintSettingsPersistence.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_pdf_export_hooks_useSongMarks|src/components/repertorio/pdf_export/hooks/useSongMarks.ts]] *(Layer: #frontend, Domain: #repertoire)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_repertorioUtils|src/utils/repertorioUtils.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_pdf_export_PdfExportContext|src/components/repertorio/pdf_export/PdfExportContext.ts]] *(from #frontend)*
- [[src_components_repertorio_PdfExportModal|src/components/repertorio/PdfExportModal.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
