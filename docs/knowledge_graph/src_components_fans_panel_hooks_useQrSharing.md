---
id: src_components_fans_panel_hooks_useQrSharing
title: "src/components/fans_panel/hooks/useQrSharing.ts"
layer: frontend
domain: social
file: "src/components/fans_panel/hooks/useQrSharing.ts"
tags: ["frontend", "social", "auto"]
---

# 📌 src/components/fans_panel/hooks/useQrSharing.ts

> **Ubicación:** `src/components/fans_panel/hooks/useQrSharing.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/social`

## 📖 Descripción
Copiar, compartir, descargar e imprimir el QR de la landing.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_qrExport|src/utils/qrExport.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_whatsapp|src/utils/whatsapp.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_fans_panel_hooks_useFansPanelController|src/components/fans_panel/hooks/useFansPanelController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
