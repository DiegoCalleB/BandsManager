---
id: src_components_bandMapPopup
title: "src/components/bandMapPopup.ts"
layer: frontend
domain: system
file: "src/components/bandMapPopup.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/bandMapPopup.ts

> **Ubicación:** `src/components/bandMapPopup.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: ColoresPopupBanda, htmlPopupBanda.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_escapeHtml|src/utils/escapeHtml.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_spotifyEmbed|src/utils/spotifyEmbed.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_BandMap|src/components/BandMap.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
