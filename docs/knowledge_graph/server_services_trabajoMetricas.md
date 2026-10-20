---
id: server_services_trabajoMetricas
title: "server/services/trabajoMetricas.ts"
layer: service
domain: system
file: "server/services/trabajoMetricas.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/trabajoMetricas.ts

> **Ubicación:** `server/services/trabajoMetricas.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Captura de métricas en segundo plano. La captura de ~35 bandas tarda minutos y una petición

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_bandMusic|server/routes/bandMusic.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/trabajoMetricas.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
