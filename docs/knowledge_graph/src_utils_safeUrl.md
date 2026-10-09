---
id: src_utils_safeUrl
title: "src/utils/safeUrl.ts"
layer: service
domain: system
file: "src/utils/safeUrl.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/safeUrl.ts

> **Ubicación:** `src/utils/safeUrl.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Enlaces de perfil de banda (dossier, rider, web, redes, Revolut/PayPal...) se guardan como

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_FansLanding|src/components/FansLanding.tsx]] *(from #frontend)*
- [[src_components_PublicEPK|src/components/PublicEPK.tsx]] *(from #frontend)*
- [[src_components_ui_InsigniaBandManager|src/components/ui/InsigniaBandManager.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
