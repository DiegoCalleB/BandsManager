---
id: sec_ssrf_guard
title: "SSRF URL Validator"
layer: security
domain: system
file: "server/utils/ssrfGuard.ts"
tags: ["security", "ssrf", "network"]
---

# 📌 SSRF URL Validator

> **Ubicación:** `server/utils/ssrfGuard.ts`  
> **Capa:** `#layer/security` | **Dominio:** `#domain/system`

## 📖 Descripción
Valida llamadas salientes fetch() bloqueando IPs privadas, loopback y metadatos cloud.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[agent_scout|Scout Discovery Agent]] *(Layer: #agent, Domain: #booking)*
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(Layer: #route, Domain: #booking)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(from #security)*
- [[agent_scout|Scout Discovery Agent]] *(from #agent)*
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(from #route)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
