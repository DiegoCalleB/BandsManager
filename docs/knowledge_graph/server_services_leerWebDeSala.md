---
id: server_services_leerWebDeSala
title: "server/services/leerWebDeSala.ts"
layer: service
domain: system
file: "server/services/leerWebDeSala.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/leerWebDeSala.ts

> **Ubicación:** `server/services/leerWebDeSala.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Lectura de la web de una sala: la portada y, si hace falta, sus páginas de contacto. Es el adaptador real de `LeerWebDeSala`.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[sec_ssrf_guard|SSRF URL Validator]] *(Layer: #security, Domain: #system)*
- [[server_utils_salaCatalogo|server/utils/salaCatalogo.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_services_catalogoScheduler|server/services/catalogoScheduler.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
