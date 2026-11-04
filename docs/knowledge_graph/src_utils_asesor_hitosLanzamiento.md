---
id: src_utils_asesor_hitosLanzamiento
title: "src/utils/asesor/hitosLanzamiento.ts"
layer: service
domain: system
file: "src/utils/asesor/hitosLanzamiento.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/asesor/hitosLanzamiento.ts

> **Ubicación:** `src/utils/asesor/hitosLanzamiento.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Hoja de ruta de un estreno: qué hacer y cuándo, contando hacia atrás desde la fecha de salida.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_campanaConcierto|src/utils/campanaConcierto.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_asesorMarketing|server/services/asesorMarketing.ts]] *(from #service)*
- [[src_utils_asesor_agenda|src/utils/asesor/agenda.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/asesor/__tests__/hitosLanzamiento.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
