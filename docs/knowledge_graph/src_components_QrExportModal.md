---
id: src_components_QrExportModal
title: "src/components/QrExportModal.tsx"
layer: frontend
domain: system
file: "src/components/QrExportModal.tsx"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/QrExportModal.tsx

> **Ubicación:** `src/components/QrExportModal.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: QrExportModal.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_fans_qr_CustomizableBandQr|src/components/fans/qr/CustomizableBandQr.tsx]] *(Layer: #frontend, Domain: #social)*
- [[src_components_fans_qr_qrCustomizationConfig|src/components/fans/qr/qrCustomizationConfig.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_utils_qrExport|src/utils/qrExport.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_conciertos_qr|Conciertos, QR y calendario]] *(from #feature)*
- [[src_components_FansPanel|src/components/FansPanel.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
