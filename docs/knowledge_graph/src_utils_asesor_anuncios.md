---
id: src_utils_asesor_anuncios
title: "src/utils/asesor/anuncios.ts"
layer: service
domain: system
file: "src/utils/asesor/anuncios.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/asesor/anuncios.ts

> **Ubicación:** `src/utils/asesor/anuncios.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Especialista en anuncios: qué piezas ya publicadas merece la pena impulsar con dinero y cuáles NO.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_asesor_metricasPorRed|src/utils/asesor/metricasPorRed.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_reglasFormato|src/utils/asesor/reglasFormato.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_resumen|src/utils/asesor/resumen.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_campanaConcierto|src/utils/campanaConcierto.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_asesorPresencia|server/services/asesorPresencia.ts]] *(from #service)*
- [[src_components_asesor_ImpulsarPanel|src/components/asesor/ImpulsarPanel.tsx]] *(from #frontend)*
- [[src_utils_asesor_presencia|src/utils/asesor/presencia.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/asesor/__tests__/anuncios.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
