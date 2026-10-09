---
id: src_utils_shareUtils
title: "src/utils/shareUtils.ts"
layer: service
domain: system
file: "src/utils/shareUtils.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/shareUtils.ts

> **Ubicación:** `src/utils/shareUtils.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: SharePayload, shareViaWebShare, shareViaWhatsApp, shareViaEmail, copyToClipboard, formatSongShareText, formatSongIdeaShareText, formatSetlistShareText.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_whatsapp|src/utils/whatsapp.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_Atril|src/components/Atril.tsx]] *(from #frontend)*
- [[src_components_calendar_PromocionConciertoModal|src/components/calendar/PromocionConciertoModal.tsx]] *(from #frontend)*
- [[src_components_InvitarBandaCard|src/components/InvitarBandaCard.tsx]] *(from #frontend)*
- [[src_components_ShareModal|src/components/ShareModal.tsx]] *(from #frontend)*
- [[src_hooks_useShareModal|src/hooks/useShareModal.ts]] *(from #hook)*
- [[src_hooks_useStudioShareModal|src/hooks/useStudioShareModal.ts]] *(from #hook)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
