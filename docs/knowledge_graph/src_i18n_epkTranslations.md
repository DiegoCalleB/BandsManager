---
id: src_i18n_epkTranslations
title: "src/i18n/epkTranslations.ts"
layer: service
domain: epk
file: "src/i18n/epkTranslations.ts"
tags: ["service", "epk", "auto"]
---

# 📌 src/i18n/epkTranslations.ts

> **Ubicación:** `src/i18n/epkTranslations.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/epk`

## 📖 Descripción
Idiomas del EPK público (/epk?band=...&lang=...). Ese enlace es la carta de presentación

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_epk_fans|server/routes/epk_fans.ts]] *(from #route)*
- [[server_utils_leadLanguage|server/utils/leadLanguage.ts]] *(from #service)*
- [[src_components_EPKManager|src/components/EPKManager.tsx]] *(from #frontend)*
- [[src_components_PublicEPK|src/components/PublicEPK.tsx]] *(from #frontend)*
- [[src_hooks_useEpkLanguage|src/hooks/useEpkLanguage.ts]] *(from #hook)*
- [[src_utils_emailFormatter|src/utils/emailFormatter.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
