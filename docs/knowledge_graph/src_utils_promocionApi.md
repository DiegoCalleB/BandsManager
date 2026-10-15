---
id: src_utils_promocionApi
title: "src/utils/promocionApi.ts"
layer: service
domain: system
file: "src/utils/promocionApi.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/promocionApi.ts

> **Ubicación:** `src/utils/promocionApi.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Cliente de las rutas de promoción: enlaces cortos, redacción de la campaña y referidos.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_campanaConcierto|src/utils/campanaConcierto.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_adn|src/utils/cartel/adn.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_config|src/utils/cartel/config.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_cartel_estilos|src/utils/cartel/estilos.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_calendar_PromocionConciertoModal|src/components/calendar/PromocionConciertoModal.tsx]] *(from #frontend)*
- [[src_components_cartel_hooks_useAdnCartel|src/components/cartel/hooks/useAdnCartel.ts]] *(from #frontend)*
- [[src_components_cartel_hooks_useEditorCartel|src/components/cartel/hooks/useEditorCartel.ts]] *(from #frontend)*
- [[src_components_dashboard_widgets_MarketingWidget|src/components/dashboard/widgets/MarketingWidget.tsx]] *(from #frontend)*
- [[src_components_dashboard_widgets_RoiBandaWidget|src/components/dashboard/widgets/RoiBandaWidget.tsx]] *(from #frontend)*
- [[src_components_InvitarBandaCard|src/components/InvitarBandaCard.tsx]] *(from #frontend)*
- [[src_hooks_useAuth|src/hooks/useAuth.ts]] *(from #security)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
