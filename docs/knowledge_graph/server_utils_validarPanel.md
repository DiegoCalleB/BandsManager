---
id: server_utils_validarPanel
title: "server/utils/validarPanel.ts"
layer: service
domain: system
file: "server/utils/validarPanel.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/validarPanel.ts

> **Ubicación:** `server/utils/validarPanel.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Validación del panel de widgets que el cliente guarda en `ui_preferences.dashboard_widgets`.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_routes_users_rutasPreferencias|server/routes/users/rutasPreferencias.ts]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/validarPanel.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
