---
id: server_utils_trackingSeguro
title: "server/utils/trackingSeguro.ts"
layer: service
domain: system
file: "server/utils/trackingSeguro.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/trackingSeguro.ts

> **Ubicación:** `server/utils/trackingSeguro.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Piezas de seguridad del seguimiento de correos (aperturas, clics, Dossier PDF) y del webhook

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_campanaConcierto|server/routes/campanaConcierto.ts]] *(from #route)*
- [[server_routes_enlacesCortos|server/routes/enlacesCortos.ts]] *(from #route)*
- [[server_routes_referidos|server/routes/referidos.ts]] *(from #route)*
- [[server_routes_tracking|server/routes/tracking.ts]] *(from #route)*
- [[server_utils_emailTemplate|server/utils/emailTemplate.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/routes/__tests__/trackingSeguridad.test.ts`
- `server/utils/__tests__/trackingSeguro.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
