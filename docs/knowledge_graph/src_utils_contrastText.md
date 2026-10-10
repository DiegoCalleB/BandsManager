---
id: src_utils_contrastText
title: "src/utils/contrastText.ts"
layer: service
domain: system
file: "src/utils/contrastText.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/utils/contrastText.ts

> **Ubicación:** `src/utils/contrastText.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Color de texto legible sobre un fondo cualquiera (avatares con el color que elige el usuario).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_app_DesktopSidebar|src/app/DesktopSidebar.tsx]] *(from #service)*
- [[src_app_MobileDrawer|src/app/MobileDrawer.tsx]] *(from #service)*
- [[src_components_repertorio_MemberNotesModal|src/components/repertorio/MemberNotesModal.tsx]] *(from #frontend)*
- [[src_components_repertorio_SongModal|src/components/repertorio/SongModal.tsx]] *(from #frontend)*
- [[src_components_UserManagementModal|src/components/UserManagementModal.tsx]] *(from #frontend)*
- [[src_components_UserProfileModal|src/components/UserProfileModal.tsx]] *(from #frontend)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
