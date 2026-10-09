---
id: src_components_UserProfileModal
title: "src/components/UserProfileModal.tsx"
layer: frontend
domain: system
file: "src/components/UserProfileModal.tsx"
tags: ["frontend", "system", "auto", "pantalla"]
---

# 📌 src/components/UserProfileModal.tsx

> **Ubicación:** `src/components/UserProfileModal.tsx`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: UserProfileModal.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_routes_users|server/routes/users.ts]] *(Layer: #route, Domain: #system)*
- [[src_components_InvitarBandaCard|src/components/InvitarBandaCard.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_common_ModalPortal|src/components/common/ModalPortal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_dashboard_AgentAutonomySettingsModal|src/components/dashboard/AgentAutonomySettingsModal.tsx]] *(Layer: #agent, Domain: #system)*
- [[src_components_ui_index|src/components/ui/index.ts]] *(Layer: #frontend, Domain: #system)*
- [[src_context_LanguageContext|src/context/LanguageContext.tsx]] *(Layer: #service, Domain: #system)*
- [[src_services_api|src/services/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_types|src/types.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_api|src/utils/api.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_audioStorage|src/utils/audioStorage.ts]] *(Layer: #service, Domain: #repertoire)*
- [[src_utils_contrastText|src/utils/contrastText.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_planPermissions|src/utils/planPermissions.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_temaEspectro|src/utils/temaEspectro.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_theme|src/utils/theme.ts]] *(Layer: #service, Domain: #system)*
- [[src_utils_typography|src/utils/typography.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_App|src/App.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
