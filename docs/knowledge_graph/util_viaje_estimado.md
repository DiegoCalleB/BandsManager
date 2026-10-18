---
id: util_viaje_estimado
title: "Estimador de viaje offline"
layer: service
domain: booking
file: "src/utils/viajeEstimado.ts"
tags: ["calendar", "travel"]
---

# 📌 Estimador de viaje offline

> **Ubicación:** `src/utils/viajeEstimado.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/booking`

## 📖 Descripción
Tabla de ~60 ciudades + haversine x1,25 a 85 km/h; vuelo/ferry fijo para islas. Sin red ni IA, para que sea determinista.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[util_calendar_conflicts|Detector de choques del calendario]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
