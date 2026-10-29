---
id: src_utils_asesor_rescate
title: "src/utils/asesor/rescate.ts"
layer: service
domain: system
file: "src/utils/asesor/rescate.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/asesor/rescate.ts

> **Ubicación:** `src/utils/asesor/rescate.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Modo rescate: detectar cuándo lo que publica la banda deja de funcionar y qué probar en su

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_asesor_diagnostico|src/utils/asesor/diagnostico.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_diagnosticoMetricas|src/utils/asesor/diagnosticoMetricas.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_reglasFormato|src/utils/asesor/reglasFormato.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_resumen|src/utils/asesor/resumen.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_campanaConcierto|src/utils/campanaConcierto.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_asesorMarketing|server/services/asesorMarketing.ts]] *(from #service)*
- [[src_utils_asesor_opciones|src/utils/asesor/opciones.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/asesor/__tests__/rescate.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
