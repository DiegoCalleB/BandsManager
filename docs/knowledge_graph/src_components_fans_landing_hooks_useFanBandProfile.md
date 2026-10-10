---
id: src_components_fans_landing_hooks_useFanBandProfile
title: "src/components/fans_landing/hooks/useFanBandProfile.ts"
layer: frontend
domain: social
file: "src/components/fans_landing/hooks/useFanBandProfile.ts"
tags: ["frontend", "social", "auto"]
---

# 📌 src/components/fans_landing/hooks/useFanBandProfile.ts

> **Ubicación:** `src/components/fans_landing/hooks/useFanBandProfile.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/social`

## 📖 Descripción
Carga del perfil público de la banda (identidad, redes, pagos, miembros, próximos conciertos).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_epk_fans|server/routes/epk_fans.ts]] *(Layer: #route, Domain: #epk)*
- [[src_components_SocialPlatformsList|src/components/SocialPlatformsList.tsx]] *(Layer: #frontend, Domain: #social)*
- [[src_components_fans_landing_fanLandingTypes|src/components/fans_landing/fanLandingTypes.ts]] *(Layer: #frontend, Domain: #social)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_bandHash|src/utils/bandHash.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_fanUtils|src/utils/fanUtils.ts]] *(Layer: #service, Domain: #social)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_fans_landing_hooks_useFansLandingController|src/components/fans_landing/hooks/useFansLandingController.ts]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
