---
id: src_components_repertorio_pdf_export_buildRowHtmlFactory
title: "src/components/repertorio/pdf_export/buildRowHtmlFactory.ts"
layer: frontend
domain: system
file: "src/components/repertorio/pdf_export/buildRowHtmlFactory.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/repertorio/pdf_export/buildRowHtmlFactory.ts

> **Ubicación:** `src/components/repertorio/pdf_export/buildRowHtmlFactory.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
HTML de cada fila del setlist (canción, bloque o nota) con su maquetación.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_repertorio_pdf_export_printLayout|src/components/repertorio/pdf_export/printLayout.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_escapeHtml|src/utils/escapeHtml.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_repertorioUtils|src/utils/repertorioUtils.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_setlistNoteText|src/utils/setlistNoteText.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_textFit|src/utils/textFit.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_pdf_export_printDocumentBuilder|src/components/repertorio/pdf_export/printDocumentBuilder.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
