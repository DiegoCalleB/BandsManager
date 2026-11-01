---
id: src_utils_asesor_clicsPieza
title: "src/utils/asesor/clicsPieza.ts"
layer: service
domain: system
file: "src/utils/asesor/clicsPieza.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/asesor/clicsPieza.ts

> **Ubicación:** `src/utils/asesor/clicsPieza.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Clics del enlace de la bio en las 48 h siguientes a publicar cada pieza. Es una medida honesta

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_asesor_instagramMedios|src/utils/asesor/instagramMedios.ts]] *(Layer: #service, Domain: #social)*
- [[src_utils_asesor_reglasFormato|src/utils/asesor/reglasFormato.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_resumen|src/utils/asesor/resumen.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_tipos|src/utils/asesor/tipos.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_campanaConcierto|src/utils/campanaConcierto.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_asesorPresencia|server/services/asesorPresencia.ts]] *(from #service)*
- [[src_utils_asesor_presencia|src/utils/asesor/presencia.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/asesor/__tests__/clicsPieza.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
