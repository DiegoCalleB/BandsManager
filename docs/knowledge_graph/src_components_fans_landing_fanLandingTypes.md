---
id: src_components_fans_landing_fanLandingTypes
title: "src/components/fans_landing/fanLandingTypes.ts"
layer: frontend
domain: social
file: "src/components/fans_landing/fanLandingTypes.ts"
tags: ["frontend", "social", "auto"]
---

# 📌 src/components/fans_landing/fanLandingTypes.ts

> **Ubicación:** `src/components/fans_landing/fanLandingTypes.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/social`

## 📖 Descripción
Tipos de la landing pública de fans: respuesta del alta y forma mínima de los datos públicos que usa.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_epk_fans|server/routes/epk_fans.ts]] *(Layer: #route, Domain: #epk)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_fans_landing_hooks_useFanBandProfile|src/components/fans_landing/hooks/useFanBandProfile.ts]] *(from #frontend)*
- [[src_components_fans_landing_hooks_useFanJoinForm|src/components/fans_landing/hooks/useFanJoinForm.ts]] *(from #frontend)*
- [[src_components_fans_landing_hooks_useFanSignupSubmit|src/components/fans_landing/hooks/useFanSignupSubmit.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
