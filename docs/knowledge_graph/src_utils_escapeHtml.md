---
id: src_utils_escapeHtml
title: "src/utils/escapeHtml.ts"
layer: service
domain: system
file: "src/utils/escapeHtml.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/escapeHtml.ts

> **Ubicación:** `src/utils/escapeHtml.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Los popups de los mapas (Leaflet) se construyen concatenando datos de banda/sala directamente

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_BandMap|src/components/BandMap.tsx]] *(from #frontend)*
- [[src_components_repertorio_PdfExportModal|src/components/repertorio/PdfExportModal.tsx]] *(from #frontend)*
- [[src_components_VenueMap|src/components/VenueMap.tsx]] *(from #frontend)*
- [[src_utils_repertorioPdf|src/utils/repertorioPdf.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
