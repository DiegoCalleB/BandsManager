---
id: src_utils_qrExport
title: "src/utils/qrExport.ts"
layer: service
domain: system
file: "src/utils/qrExport.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/qrExport.ts

> **Ubicación:** `src/utils/qrExport.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: QrExportOptions, urlToDataUrl, getCleanSvgString, downloadQrAsSvg, downloadQrAsHighResPng, printHighQualityFlyer.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_qrSvg|src/utils/qrSvg.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_fans_panel_hooks_useQrSharing|src/components/fans_panel/hooks/useQrSharing.ts]] *(from #frontend)*
- [[src_components_QrExportModal|src/components/QrExportModal.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
