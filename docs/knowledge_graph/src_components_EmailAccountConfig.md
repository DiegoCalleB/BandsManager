---
id: src_components_EmailAccountConfig
title: "src/components/EmailAccountConfig.tsx"
layer: frontend
domain: system
file: "src/components/EmailAccountConfig.tsx"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/EmailAccountConfig.tsx

> **Ubicación:** `src/components/EmailAccountConfig.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: EmailAccountConfig.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_GmailOAuthEstado|src/components/GmailOAuthEstado.tsx]] *(Layer: #security, Domain: #auth)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_services_api|src/services/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_services_tiposApi|src/services/tiposApi.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_errorCapturado|src/utils/errorCapturado.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_motivoGmailOAuth|src/utils/motivoGmailOAuth.ts]] *(Layer: #security, Domain: #auth)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_dashboard_agent_autonomy_EmailDispatchTab|src/components/dashboard/agent_autonomy/EmailDispatchTab.tsx]] *(from #agent)*

---

## 🧪 Tests que lo cubren
- `src/components/__tests__/EmailAccountConfig.test.tsx`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
