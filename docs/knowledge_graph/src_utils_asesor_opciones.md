---
id: src_utils_asesor_opciones
title: "src/utils/asesor/opciones.ts"
layer: service
domain: system
file: "src/utils/asesor/opciones.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/asesor/opciones.ts

> **Ubicación:** `src/utils/asesor/opciones.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Qué publicar hoy: varias ideas por modo para que la banda elija, ordenadas por lo que le suele

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_asesor_diagnostico|src/utils/asesor/diagnostico.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_estrategia|src/utils/asesor/estrategia.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_reglasFormato|src/utils/asesor/reglasFormato.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_campanaConcierto|src/utils/campanaConcierto.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_db_asesorMarketing|server/db/asesorMarketing.ts]] *(from #db)*
- [[server_services_asesorMarketing|server/services/asesorMarketing.ts]] *(from #service)*
- [[src_components_asesor_AsesorView|src/components/asesor/AsesorView.tsx]] *(from #frontend)*
- [[src_components_asesor_PiezaSheet|src/components/asesor/PiezaSheet.tsx]] *(from #frontend)*
- [[src_components_asesor_TarjetaHoy|src/components/asesor/TarjetaHoy.tsx]] *(from #frontend)*
- [[src_utils_asesor_pieza|src/utils/asesor/pieza.ts]] *(from #service)*
- [[src_utils_asesorApi|src/utils/asesorApi.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/asesor/__tests__/opciones.test.ts`
- `src/utils/asesor/__tests__/pieza.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
