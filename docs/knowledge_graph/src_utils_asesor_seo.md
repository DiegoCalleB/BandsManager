---
id: src_utils_asesor_seo
title: "src/utils/asesor/seo.ts"
layer: service
domain: system
file: "src/utils/asesor/seo.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/asesor/seo.ts

> **Ubicación:** `src/utils/asesor/seo.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Kit de SEO de la banda: las frases con las que la buscan, y bios de cada red con su límite de

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_asesor_reglasFormato|src/utils/asesor/reglasFormato.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_asesorPresencia|server/services/asesorPresencia.ts]] *(from #service)*
- [[src_components_asesor_SeoPanel|src/components/asesor/SeoPanel.tsx]] *(from #frontend)*
- [[src_utils_asesor_auditoria|src/utils/asesor/auditoria.ts]] *(from #service)*
- [[src_utils_asesor_presencia|src/utils/asesor/presencia.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/asesor/__tests__/seo.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
