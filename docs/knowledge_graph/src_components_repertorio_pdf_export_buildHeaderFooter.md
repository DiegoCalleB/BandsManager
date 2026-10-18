---
id: src_components_repertorio_pdf_export_buildHeaderFooter
title: "src/components/repertorio/pdf_export/buildHeaderFooter.ts"
layer: frontend
domain: system
file: "src/components/repertorio/pdf_export/buildHeaderFooter.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/repertorio/pdf_export/buildHeaderFooter.ts

> **Ubicación:** `src/components/repertorio/pdf_export/buildHeaderFooter.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Cabecera (logo, título, métricas) y pie (QR y marca) de cada hoja impresa.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_escapeHtml|src/utils/escapeHtml.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_qrSvg|src/utils/qrSvg.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_repertorioUtils|src/utils/repertorioUtils.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_setlistNoteText|src/utils/setlistNoteText.ts]] *(Layer: #service, Domain: #repertoire)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_pdf_export_printDocumentBuilder|src/components/repertorio/pdf_export/printDocumentBuilder.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
