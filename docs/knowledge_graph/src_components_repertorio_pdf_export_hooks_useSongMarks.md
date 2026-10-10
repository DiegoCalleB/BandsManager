---
id: src_components_repertorio_pdf_export_hooks_useSongMarks
title: "src/components/repertorio/pdf_export/hooks/useSongMarks.ts"
layer: frontend
domain: repertoire
file: "src/components/repertorio/pdf_export/hooks/useSongMarks.ts"
tags: ["frontend", "repertoire", "auto"]
---

# 📌 src/components/repertorio/pdf_export/hooks/useSongMarks.ts

> **Ubicación:** `src/components/repertorio/pdf_export/hooks/useSongMarks.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/repertoire`

## 📖 Descripción
Marcas por miembro sobre las canciones (qué toca cada uno) y su edición masiva.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_repertorioUtils|src/utils/repertorioUtils.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_pdf_export_hooks_usePdfExportController|src/components/repertorio/pdf_export/hooks/usePdfExportController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
