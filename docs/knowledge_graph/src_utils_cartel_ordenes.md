---
id: src_utils_cartel_ordenes
title: "src/utils/cartel/ordenes.ts"
layer: service
domain: system
file: "src/utils/cartel/ordenes.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/cartel/ordenes.ts

> **Ubicación:** `src/utils/cartel/ordenes.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
«Pídele cambios al cartel»: una frase («pon la fecha más grande y roja, quita el logo y el cielo más oscuro»)

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_cartel_ajustesFinos|src/utils/cartel/ajustesFinos.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_config|src/utils/cartel/config.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_formatos|src/utils/cartel/formatos.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_textosLibres|src/utils/cartel/textosLibres.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_voces|src/utils/cartel/voces.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_ordenCartel|server/services/ordenCartel.ts]] *(from #service)*
- [[src_components_cartel_hooks_useOrdenCartel|src/components/cartel/hooks/useOrdenCartel.ts]] *(from #frontend)*
- [[src_utils_promocionApi|src/utils/promocionApi.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/cartel/__tests__/ordenes.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
