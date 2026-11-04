---
id: src_utils_asesor_presencia
title: "src/utils/asesor/presencia.ts"
layer: service
domain: system
file: "src/utils/asesor/presencia.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/asesor/presencia.ts

> **Ubicación:** `src/utils/asesor/presencia.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
La forma de lo que devuelve `POST /api/asesor/presencia`: la define aquí, en `src/`, para que el

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_asesor_anuncios|src/utils/asesor/anuncios.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_auditoria|src/utils/asesor/auditoria.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_clicsPieza|src/utils/asesor/clicsPieza.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_reglasFormato|src/utils/asesor/reglasFormato.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_asesor_seo|src/utils/asesor/seo.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_asesorPresencia|server/services/asesorPresencia.ts]] *(from #service)*
- [[src_components_asesor_AuditoriaPanel|src/components/asesor/AuditoriaPanel.tsx]] *(from #frontend)*
- [[src_components_asesor_EnlacesPanel|src/components/asesor/EnlacesPanel.tsx]] *(from #frontend)*
- [[src_components_asesor_hooks_usePresencia|src/components/asesor/hooks/usePresencia.ts]] *(from #frontend)*
- [[src_components_asesor_SeoPanel|src/components/asesor/SeoPanel.tsx]] *(from #frontend)*
- [[src_utils_asesorApi|src/utils/asesorApi.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
