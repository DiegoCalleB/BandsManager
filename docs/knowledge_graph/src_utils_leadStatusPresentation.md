---
id: src_utils_leadStatusPresentation
title: "src/utils/leadStatusPresentation.ts"
layer: service
domain: booking
file: "src/utils/leadStatusPresentation.ts"
tags: ["service", "booking", "auto"]
---

# 📌 src/utils/leadStatusPresentation.ts

> **Ubicación:** `src/utils/leadStatusPresentation.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/booking`

## 📖 Descripción
Tabla única de colores/etiqueta por estado de lead - antes vivía duplicada (y con valores

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_booking_crm_hooks_useLeadActions|src/components/booking/crm/hooks/useLeadActions.ts]] *(from #frontend)*
- [[src_components_Dashboard|src/components/Dashboard.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
