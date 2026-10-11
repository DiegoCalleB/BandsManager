---
id: src_components_user_profile_UserProfileContext
title: "src/components/user_profile/UserProfileContext.ts"
layer: frontend
domain: system
file: "src/components/user_profile/UserProfileContext.ts"
tags: ["frontend", "system", "auto"]
---

# 📌 src/components/user_profile/UserProfileContext.ts

> **Ubicación:** `src/components/user_profile/UserProfileContext.ts`  
> **Capa:** `#layer/frontend` | **Dominio:** `#domain/system`

## 📖 Descripción
Contexto del perfil de usuario: reparte el estado del controlador y las props a las vistas.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_UserProfileModal|src/components/UserProfileModal.tsx]] *(Layer: #frontend, Domain: #system)*
- [[src_components_user_profile_hooks_useUserProfileController|src/components/user_profile/hooks/useUserProfileController.ts]] *(Layer: #frontend, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_user_profile_AdminBandSection|src/components/user_profile/AdminBandSection.tsx]] *(from #frontend)*
- [[src_components_user_profile_AgentConfigCard|src/components/user_profile/AgentConfigCard.tsx]] *(from #agent)*
- [[src_components_user_profile_AppearanceSettings|src/components/user_profile/AppearanceSettings.tsx]] *(from #frontend)*
- [[src_components_user_profile_BandCreateForm|src/components/user_profile/BandCreateForm.tsx]] *(from #frontend)*
- [[src_components_user_profile_BandDeleteConfirm|src/components/user_profile/BandDeleteConfirm.tsx]] *(from #frontend)*
- [[src_components_user_profile_BandLogoSection|src/components/user_profile/BandLogoSection.tsx]] *(from #frontend)*
- [[src_components_user_profile_BandSelectionSection|src/components/user_profile/BandSelectionSection.tsx]] *(from #frontend)*
- [[src_components_user_profile_EspectroPreferenceCard|src/components/user_profile/EspectroPreferenceCard.tsx]] *(from #frontend)*
- [[src_components_user_profile_IdentityFields|src/components/user_profile/IdentityFields.tsx]] *(from #frontend)*
- [[src_components_user_profile_LanguageSelector|src/components/user_profile/LanguageSelector.tsx]] *(from #frontend)*
- [[src_components_user_profile_NotificationSettingsCard|src/components/user_profile/NotificationSettingsCard.tsx]] *(from #frontend)*
- [[src_components_user_profile_PasswordSection|src/components/user_profile/PasswordSection.tsx]] *(from #frontend)*
- [[src_components_user_profile_ProfileFooter|src/components/user_profile/ProfileFooter.tsx]] *(from #frontend)*
- [[src_components_user_profile_ProfileHeader|src/components/user_profile/ProfileHeader.tsx]] *(from #frontend)*
- [[src_components_user_profile_ProfilePlanSection|src/components/user_profile/ProfilePlanSection.tsx]] *(from #frontend)*
- [[src_components_user_profile_UpgradePlanDialog|src/components/user_profile/UpgradePlanDialog.tsx]] *(from #frontend)*
- [[src_components_user_profile_UserProfileProvider|src/components/user_profile/UserProfileProvider.tsx]] *(from #frontend)*
- [[src_components_user_profile_UserProfileView|src/components/user_profile/UserProfileView.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/components/user_profile/__tests__/userProfileContracts.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
