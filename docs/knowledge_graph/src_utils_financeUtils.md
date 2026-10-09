---
id: src_utils_financeUtils
title: "src/utils/financeUtils.ts"
layer: service
domain: finances
file: "src/utils/financeUtils.ts"
tags: ["service", "finances", "auto"]
---

# 📌 src/utils/financeUtils.ts

> **Ubicación:** `src/utils/financeUtils.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/finances`

## 📖 Descripción
Exporta: CategoryBreakdown, FinancialSummary, calculateFinancialSummary, calculateConcertROI, calculateConcertExpenses, forecastConcertRevenue.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_Finanzas|src/components/Finanzas.tsx]] *(from #frontend)*
- [[src_components_finanzas_FinanceSummaryCards|src/components/finanzas/FinanceSummaryCards.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
