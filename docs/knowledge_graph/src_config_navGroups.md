---
id: src_config_navGroups
title: "src/config/navGroups.tsx"
layer: service
domain: system
file: "src/config/navGroups.tsx"
tags: ["service", "system", "auto"]
---

# 📌 src/config/navGroups.tsx

> **Ubicación:** `src/config/navGroups.tsx`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: NavItemId, NavItemDef, NAV_ITEMS, NavGroupDef, NAV_PINNED_TOP_IDS, NAV_PINNED_BOTTOM_IDS, NAV_GROUPS_DESKTOP, NAV_GROUPS_MOBILE.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_app_DesktopSidebar|src/app/DesktopSidebar.tsx]] *(from #service)*
- [[src_app_hooks_useAppController|src/app/hooks/useAppController.ts]] *(from #service)*
- [[src_app_hooks_useAppNavigation|src/app/hooks/useAppNavigation.ts]] *(from #service)*
- [[src_app_hooks_useNavState|src/app/hooks/useNavState.ts]] *(from #service)*
- [[src_app_hooks_useShellState|src/app/hooks/useShellState.ts]] *(from #service)*
- [[src_app_MobileBottomTabBar|src/app/MobileBottomTabBar.tsx]] *(from #service)*
- [[src_app_MobileDrawer|src/app/MobileDrawer.tsx]] *(from #service)*
- [[src_app_MobileGroupSheet|src/app/MobileGroupSheet.tsx]] *(from #service)*
- [[src_components_common_NavGroupSection|src/components/common/NavGroupSection.tsx]] *(from #frontend)*
- [[src_components_common_NavItemButton|src/components/common/NavItemButton.tsx]] *(from #frontend)*
- [[src_components_onboarding_MusicianOnboardingModal|src/components/onboarding/MusicianOnboardingModal.tsx]] *(from #frontend)*

---

## 🧪 Tests que lo cubren
- `src/config/__tests__/navGroups.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
