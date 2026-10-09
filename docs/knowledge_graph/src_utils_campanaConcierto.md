---
id: src_utils_campanaConcierto
title: "src/utils/campanaConcierto.ts"
layer: service
domain: system
file: "src/utils/campanaConcierto.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/campanaConcierto.ts

> **Ubicación:** `src/utils/campanaConcierto.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Campaña de cuenta atrás de un concierto: qué publicar y cuándo. Lógica pura, sin I/O, compartida

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_campanaConcierto|server/routes/campanaConcierto.ts]] *(from #route)*
- [[src_components_calendar_PromocionConciertoModal|src/components/calendar/PromocionConciertoModal.tsx]] *(from #frontend)*
- [[src_utils_promocionApi|src/utils/promocionApi.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
