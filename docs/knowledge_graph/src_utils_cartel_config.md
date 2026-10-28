---
id: src_utils_cartel_config
title: "src/utils/cartel/config.ts"
layer: service
domain: system
file: "src/utils/cartel/config.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/cartel/config.ts

> **Ubicación:** `src/utils/cartel/config.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Lo que se guarda de un cartel en `concerts.cartel_config` (jsonb). Lo usan el cliente (al leer

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_cartel_formatos|src/utils/cartel/formatos.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_plantillas|src/utils/cartel/plantillas.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_voces|src/utils/cartel/voces.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_cartelria|server/routes/cartelria.ts]] *(from #route)*
- [[src_components_cartel_AjustesCartel|src/components/cartel/AjustesCartel.tsx]] *(from #frontend)*
- [[src_components_cartel_hooks_useEditorCartel|src/components/cartel/hooks/useEditorCartel.ts]] *(from #frontend)*
- [[src_utils_cartel_render|src/utils/cartel/render.ts]] *(from #service)*
- [[src_utils_promocionApi|src/utils/promocionApi.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/cartelUrl.test.ts`
- `src/utils/cartel/__tests__/config.test.ts`
- `src/utils/cartel/__tests__/datos.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
