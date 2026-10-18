---
id: server_utils_persistenciaEstado
title: "server/utils/persistenciaEstado.ts"
layer: service
domain: system
file: "server/utils/persistenciaEstado.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/persistenciaEstado.ts

> **Ubicación:** `server/utils/persistenciaEstado.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Escritura diferida del respaldo local del estado (data.json). La caché en memoria es la fuente de

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[db_state_sync|In-Memory State & Supabase Sync]] *(from #db)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/persistenciaEstado.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
