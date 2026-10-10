---
id: src_components_repertorio_pdf_export_hooks_usePrintPreview
title: "src/components/repertorio/pdf_export/hooks/usePrintPreview.ts"
layer: frontend
domain: system
file: "src/components/repertorio/pdf_export/hooks/usePrintPreview.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/repertorio/pdf_export/hooks/usePrintPreview.ts

> **Ubicación:** `src/components/repertorio/pdf_export/hooks/usePrintPreview.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Vista previa paginada del documento, impresión y edición de notas por canción.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_repertorio_pdf_export_printDocumentBuilder|src/components/repertorio/pdf_export/printDocumentBuilder.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_components_repertorio_pdf_export_printLayout|src/components/repertorio/pdf_export/printLayout.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_repertorioUtils|src/utils/repertorioUtils.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_textFit|src/utils/textFit.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_pdf_export_hooks_usePdfExportController|src/components/repertorio/pdf_export/hooks/usePdfExportController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
