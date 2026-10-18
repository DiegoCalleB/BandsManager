---
id: server_services_comentariosYoutube
title: "server/services/comentariosYoutube.ts"
layer: service
domain: system
file: "server/services/comentariosYoutube.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/comentariosYoutube.ts

> **Ubicación:** `server/services/comentariosYoutube.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Comentarios más relevantes de un vídeo de YouTube, para sacar las marcas de tiempo

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_interesDelPublico|server/services/interesDelPublico.ts]] *(from #service)*
- [[server_utils_informeSenalesPublico|server/utils/informeSenalesPublico.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/comentariosYoutube.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
