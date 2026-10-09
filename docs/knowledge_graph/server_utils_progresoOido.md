---
id: server_utils_progresoOido
title: "server/utils/progresoOido.ts"
layer: service
domain: system
file: "server/utils/progresoOido.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/progresoOido.ts

> **Ubicación:** `server/utils/progresoOido.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Progreso de «El Oído» (el análisis del audio: acordes, tono, tempo y letra). Las peticiones son

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_repertoire|Repertoire & Setlists Route]] *(from #route)*
- [[server_services_letraCancion|server/services/letraCancion.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/progresoOido.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
