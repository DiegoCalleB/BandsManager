---
id: src_utils_asesor_diagnostico
title: "src/utils/asesor/diagnostico.ts"
layer: service
domain: system
file: "src/utils/asesor/diagnostico.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/asesor/diagnostico.ts

> **Ubicación:** `src/utils/asesor/diagnostico.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
El diagnóstico diario del asesor: en qué momento está la banda (modo). Qué publicar dentro de

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_asesor_estrategia|src/utils/asesor/estrategia.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_campanaConcierto|src/utils/campanaConcierto.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_asesorMarketing|server/services/asesorMarketing.ts]] *(from #service)*
- [[src_components_asesor_AsesorView|src/components/asesor/AsesorView.tsx]] *(from #frontend)*
- [[src_utils_asesor_opciones|src/utils/asesor/opciones.ts]] *(from #service)*
- [[src_utils_asesorApi|src/utils/asesorApi.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/asesor/__tests__/diagnostico.test.ts`
- `src/utils/asesor/__tests__/opciones.test.ts`
- `src/utils/asesor/__tests__/resumen.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
