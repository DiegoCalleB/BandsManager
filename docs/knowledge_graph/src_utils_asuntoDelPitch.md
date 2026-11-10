---
id: src_utils_asuntoDelPitch
title: "src/utils/asuntoDelPitch.ts"
layer: service
domain: booking
file: "src/utils/asuntoDelPitch.ts"
tags: ["service", "booking", "auto"]
---

# 📌 src/utils/asuntoDelPitch.ts

> **Ubicación:** `src/utils/asuntoDelPitch.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/booking`

## 📖 Descripción
El pitch de una campaña puede llevar su asunto en la primera línea («Asunto: …»). Así el asunto se ve y se edita junto

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_enviador|Enviador Agent (Dispatcher)]] *(from #agent)*
- [[server_utils_reglasPitchFestival|server/utils/reglasPitchFestival.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `src/utils/__tests__/asuntoDelPitch.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
