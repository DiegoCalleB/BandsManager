---
id: src_utils_textFit
title: "src/utils/textFit.ts"
layer: service
domain: system
file: "src/utils/textFit.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/textFit.ts

> **Ubicación:** `src/utils/textFit.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Ajuste de texto a un ancho disponible para las notas manuscritas del repertorio imprimible

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_pdf_export_buildRowHtmlFactory|src/components/repertorio/pdf_export/buildRowHtmlFactory.ts]] *(from #frontend)*
- [[src_components_repertorio_pdf_export_hooks_usePrintPreview|src/components/repertorio/pdf_export/hooks/usePrintPreview.ts]] *(from #frontend)*
- [[src_components_repertorio_pdf_export_printDocumentBuilder|src/components/repertorio/pdf_export/printDocumentBuilder.ts]] *(from #frontend)*
- [[src_components_repertorio_pdf_export_printLayout|src/components/repertorio/pdf_export/printLayout.ts]] *(from #frontend)*
- [[src_components_repertorio_pdf_export_SheetPreviewPane|src/components/repertorio/pdf_export/SheetPreviewPane.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/textFit.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
