---
id: src_components_Finanzas
title: "src/components/Finanzas.tsx"
layer: frontend
domain: system
file: "src/components/Finanzas.tsx"
tags: ["frontend", "system", "auto", "pantalla"]
---

# 📌 src/components/Finanzas.tsx

> **Ubicación:** `src/components/Finanzas.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: Finanzas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_concerts|server/routes/concerts.ts]] *(Layer: #route, Domain: #system)*
- [[src_components_finanzas_AddTransactionModal|src/components/finanzas/AddTransactionModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_finanzas_FinanceSummaryCards|src/components/finanzas/FinanceSummaryCards.tsx]] *(Layer: #frontend, Domain: #finances)*
- [[src_components_ui_PublicoSilhouette|src/components/ui/PublicoSilhouette.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_ShowIcon|src/components/ui/ShowIcon.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_Tabs|src/components/ui/Tabs.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_financeUtils|src/utils/financeUtils.ts]] *(Layer: #service, Domain: #finances)*
- [[src_utils_formatMoney|src/utils/formatMoney.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_finanzas_planes|Finanzas, merchan y planes]] *(from #feature)*
- [[src_App|src/App.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
