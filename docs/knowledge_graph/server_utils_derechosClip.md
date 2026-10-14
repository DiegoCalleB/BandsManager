---
id: server_utils_derechosClip
title: "server/utils/derechosClip.ts"
layer: service
domain: system
file: "server/utils/derechosClip.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/derechosClip.ts

> **Ubicación:** `server/utils/derechosClip.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
¿Puede la banda publicar este vídeo de YouTube como suyo?

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_db_reelClips|server/db/reelClips.ts]] *(Layer: #db, Domain: #social)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
_Sin llamadas entrantes indexadas._

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/derechosClip.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
