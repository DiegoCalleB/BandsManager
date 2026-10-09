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
- [[agent_scout|Scout Discovery Agent]] *(from #agent)*
- [[route_leads_enrichment|Ruta de enriquecimiento de salas]] *(from #route)*
- [[sec_trust_boundary|Trust Boundary & Band Scoping]] *(from #security)*
- [[server_routes_ai_music|server/routes/ai_music.ts]] *(from #route)*
- [[server_routes_bands|server/routes/bands.ts]] *(from #route)*
- [[server_routes_concert_to_album|server/routes/concert_to_album.ts]] *(from #route)*
- [[server_services_audioSeparator_AudioSeparatorService|server/services/audioSeparator/AudioSeparatorService.ts]] *(from #service)*
- [[server_services_audioSeparator_LalalAiService|server/services/audioSeparator/LalalAiService.ts]] *(from #service)*
- [[server_services_audioTransposeService|server/services/audioTransposeService.ts]] *(from #service)*
- [[server_services_jinaReaderService|server/services/jinaReaderService.ts]] *(from #service)*
- [[server_services_socialRadarService|server/services/socialRadarService.ts]] *(from #service)*
- [[server_services_stemPredictionReconciler|server/services/stemPredictionReconciler.ts]] *(from #service)*
- [[server_utils_audioEnergy|server/utils/audioEnergy.ts]] *(from #service)*
- [[server_utils_optimizeExistingWavs|server/utils/optimizeExistingWavs.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
