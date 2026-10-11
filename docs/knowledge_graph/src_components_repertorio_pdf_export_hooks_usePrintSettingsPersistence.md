---
id: src_components_repertorio_pdf_export_hooks_usePrintSettingsPersistence
title: "src/components/repertorio/pdf_export/hooks/usePrintSettingsPersistence.ts"
layer: frontend
domain: system
file: "src/components/repertorio/pdf_export/hooks/usePrintSettingsPersistence.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/repertorio/pdf_export/hooks/usePrintSettingsPersistence.ts

> **Ubicación:** `src/components/repertorio/pdf_export/hooks/usePrintSettingsPersistence.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Carga y guarda en el servidor los ajustes de impresión del setlist activo.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_bands|server/routes/bands.ts]] *(Layer: #route, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_printSettings|src/utils/printSettings.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_repertorio_pdf_export_hooks_usePdfExportController|src/components/repertorio/pdf_export/hooks/usePdfExportController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
