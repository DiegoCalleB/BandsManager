---
id: server_utils_bloqueoOido
title: "server/utils/bloqueoOido.ts"
layer: service
domain: system
file: "server/utils/bloqueoOido.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/bloqueoOido.ts

> **Ubicación:** `server/utils/bloqueoOido.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Canciones cuyo audio se está procesando ahora mismo («El Oído»: acordes y letra), clave `${bandId}:${songId}`.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_repertoire|Repertoire & Setlists Route]] *(from #route)*
- [[server_services_letraCancion|server/services/letraCancion.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
