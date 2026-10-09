---
id: src_utils_emailFormatter
title: "src/utils/emailFormatter.ts"
layer: service
domain: system
file: "src/utils/emailFormatter.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/emailFormatter.ts

> **Ubicación:** `src/utils/emailFormatter.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: EmailAttachment, FormattedEmailResult, SignatureDataParams, SOCIAL_ICONS_BADGES_MAP, buildEmailSignatureData, buildEmailSignatureHtml, buildEmailSignaturePlainText, copyRichSignatureToClipboard.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_i18n_epkTranslations|src/i18n/epkTranslations.ts]] *(Layer: #service, Domain: #epk)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_epk_EPKFirmaQRBlock|src/components/epk/EPKFirmaQRBlock.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
