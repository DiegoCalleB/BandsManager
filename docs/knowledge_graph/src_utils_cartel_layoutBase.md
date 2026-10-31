---
id: src_utils_cartel_layoutBase
title: "src/utils/cartel/layoutBase.ts"
layer: service
domain: system
file: "src/utils/cartel/layoutBase.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/cartel/layoutBase.ts

> **Ubicación:** `src/utils/cartel/layoutBase.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Piezas comunes del layout del cartel: tipos, el reparto del nombre en líneas, la fecha con jerarquía y la fila

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_cartel_ajustesFinos|src/utils/cartel/ajustesFinos.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_formatos|src/utils/cartel/formatos.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_texto|src/utils/cartel/texto.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_voces|src/utils/cartel/voces.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_utils_cartel_ajustesFinos|src/utils/cartel/ajustesFinos.ts]] *(from #service)*
- [[src_utils_cartel_composiciones|src/utils/cartel/composiciones.ts]] *(from #service)*
- [[src_utils_cartel_layout|src/utils/cartel/layout.ts]] *(from #service)*
- [[src_utils_cartel_textosLibres|src/utils/cartel/textosLibres.ts]] *(from #service)*
- [[src_utils_cartel_tintaImpresa|src/utils/cartel/tintaImpresa.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
