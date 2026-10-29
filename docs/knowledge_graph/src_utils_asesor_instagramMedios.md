---
id: src_utils_asesor_instagramMedios
title: "src/utils/asesor/instagramMedios.ts"
layer: service
domain: social
file: "src/utils/asesor/instagramMedios.ts"
tags: ["service", "social", "auto"]
---

# 📌 src/utils/asesor/instagramMedios.ts

> **Ubicación:** `src/utils/asesor/instagramMedios.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/social`

## 📖 Descripción
Publicaciones de Instagram de la banda y cuál corresponde a cada pieza del asesor. Lógica pura,

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_asesor_reglasFormato|src/utils/asesor/reglasFormato.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_campanaConcierto|src/utils/campanaConcierto.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_asesorInstagram|server/services/asesorInstagram.ts]] *(from #service)*
- [[src_components_asesor_PorMedirCard|src/components/asesor/PorMedirCard.tsx]] *(from #frontend)*
- [[src_utils_asesorApi|src/utils/asesorApi.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/asesor/__tests__/instagramMedios.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
