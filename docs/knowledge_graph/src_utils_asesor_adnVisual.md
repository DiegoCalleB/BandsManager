---
id: src_utils_asesor_adnVisual
title: "src/utils/asesor/adnVisual.ts"
layer: service
domain: system
file: "src/utils/asesor/adnVisual.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/asesor/adnVisual.ts

> **Ubicación:** `src/utils/asesor/adnVisual.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
El ADN visual de la banda aplicado a las láminas: qué fotos suyas hay, qué letra les corresponde

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_asesor_laminas|src/utils/asesor/laminas.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_adn|src/utils/cartel/adn.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_voces|src/utils/cartel/voces.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_asesor_hooks_useLaminas|src/components/asesor/hooks/useLaminas.ts]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/asesor/__tests__/adnVisual.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
