---
id: server_services_emailsSinEvidencia
title: "server/services/emailsSinEvidencia.ts"
layer: service
domain: system
file: "server/services/emailsSinEvidencia.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/emailsSinEvidencia.ts

> **Ubicación:** `server/services/emailsSinEvidencia.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Puerta final de los emails de un lead: lo que aportó una IA o un buscador solo se queda si hay evidencia.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[sec_ssrf_guard|SSRF URL Validator]] *(Layer: #security, Domain: #system)*
- [[server_utils_emailConEvidencia|server/utils/emailConEvidencia.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_emailValidator|server/utils/emailValidator.ts]] *(Layer: #service, Domain: #system)*
- [[server_utils_procedenciaDatos|server/utils/procedenciaDatos.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_scout|Scout Discovery Agent]] *(from #agent)*
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(from #route)*
- [[server_routes_leads_places|server/routes/leads/places.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/emailsSinEvidencia.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
