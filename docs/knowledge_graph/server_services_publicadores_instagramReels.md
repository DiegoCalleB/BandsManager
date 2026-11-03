---
id: server_services_publicadores_instagramReels
title: "server/services/publicadores/instagramReels.ts"
layer: service
domain: social
file: "server/services/publicadores/instagramReels.ts"
tags: ["service", "social", "auto"]
---

# 📌 server/services/publicadores/instagramReels.ts

> **Ubicación:** `server/services/publicadores/instagramReels.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/social`

## 📖 Descripción
Publicación real de un Reel en Instagram (Content Publishing API de Meta).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_asesorInstagram|server/services/asesorInstagram.ts]] *(from #service)*
- [[server_services_asesorPresencia|server/services/asesorPresencia.ts]] *(from #service)*
- [[server_services_credencialesInstagram|server/services/credencialesInstagram.ts]] *(from #service)*
- [[server_services_publicadores_instagramInsights|server/services/publicadores/instagramInsights.ts]] *(from #service)*
- [[server_services_socialPublisher|server/services/socialPublisher.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/services/publicadores/__tests__/instagramReels.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
