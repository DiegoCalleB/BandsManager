---
id: server_utils_urlHost
title: "server/utils/urlHost.ts"
layer: service
domain: system
file: "server/utils/urlHost.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/urlHost.ts

> **Ubicación:** `server/utils/urlHost.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Comparar el host de una URL con un dominio NO se puede hacer con `url.includes('dominio.com')`:

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_scout|Scout Discovery Agent]] *(from #agent)*
- [[route_leads_crud|Leads CRUD Route]] *(from #route)*
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(from #route)*
- [[server_utils_instagramConocido|server/utils/instagramConocido.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/urlHost.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
