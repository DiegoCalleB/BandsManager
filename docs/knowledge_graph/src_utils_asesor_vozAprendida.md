---
id: src_utils_asesor_vozAprendida
title: "src/utils/asesor/vozAprendida.ts"
layer: service
domain: system
file: "src/utils/asesor/vozAprendida.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/asesor/vozAprendida.ts

> **Ubicación:** `src/utils/asesor/vozAprendida.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Lo que el sistema ya ha aprendido de cómo habla una banda y que va más allá del tono: los

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_asesor_pieza|src/utils/asesor/pieza.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_asesorMarketing|server/services/asesorMarketing.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/asesor/__tests__/vozAprendida.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
