---
id: src_utils_asesor_auditoria
title: "src/utils/asesor/auditoria.ts"
layer: service
domain: system
file: "src/utils/asesor/auditoria.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/asesor/auditoria.ts

> **Ubicación:** `src/utils/asesor/auditoria.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Auditoría 360 de la presencia de una banda: cada especialista (SEO, Instagram, TikTok, YouTube,

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_asesor_reglasFormato|src/utils/asesor/reglasFormato.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_seo|src/utils/asesor/seo.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_asesorPresencia|server/services/asesorPresencia.ts]] *(from #service)*
- [[src_components_asesor_AuditoriaPanel|src/components/asesor/AuditoriaPanel.tsx]] *(from #frontend)*
- [[src_components_asesor_EnlacesPanel|src/components/asesor/EnlacesPanel.tsx]] *(from #frontend)*
- [[src_utils_asesor_presencia|src/utils/asesor/presencia.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/asesor/__tests__/auditoria.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
