---
id: src_utils_confirmarEmail
title: "src/utils/confirmarEmail.ts"
layer: service
domain: system
file: "src/utils/confirmarEmail.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/confirmarEmail.ts

> **Ubicación:** `src/utils/confirmarEmail.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Confirmar un email caducado: una persona de la banda lo ha comprobado (lo ha probado, lo ha visto en la web…) y

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_fiabilidadEmail|src/utils/fiabilidadEmail.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_leads_crud|Leads CRUD Route]] *(from #route)*
- [[src_components_booking_leads_table_BotonConfirmarEmail|src/components/booking/leads_table/BotonConfirmarEmail.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/confirmarEmail.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
