---
id: src_utils_plantillaFestival
title: "src/utils/plantillaFestival.ts"
layer: service
domain: system
file: "src/utils/plantillaFestival.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/plantillaFestival.ts

> **Ubicación:** `src/utils/plantillaFestival.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Plantilla de email para una campaña de festivales: un texto con huecos ({festival}, {ciudad}, {linea_publico},

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_prepararEmailsCampana|server/services/prepararEmailsCampana.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/reglasPitchFestival.test.ts`
- `src/utils/__tests__/plantillaFestival.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
