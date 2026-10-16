---
id: server_services_interesDelPublico
title: "server/services/interesDelPublico.ts"
layer: service
domain: system
file: "server/services/interesDelPublico.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/interesDelPublico.ts

> **Ubicación:** `server/services/interesDelPublico.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Interés del público por segundo para un vídeo de YouTube (Fase de detección de momentos).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_services_comentariosYoutube|server/services/comentariosYoutube.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_senalesPublico|server/utils/senalesPublico.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_viralSignals|server/utils/viralSignals.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_senalesVideo|server/services/senalesVideo.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/interesDelPublico.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
