---
id: src_services_browserNotificationService
title: "src/services/browserNotificationService.ts"
layer: service
domain: system
file: "src/services/browserNotificationService.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/services/browserNotificationService.ts

> **Ubicación:** `src/services/browserNotificationService.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: isBrowserNotificationSupported, getBrowserNotificationPermission, requestBrowserNotificationPermission, loadNotificationConfig, saveNotificationConfig, loadNotificationHistory, saveNotificationHistory, addNotificationToHistory.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_types_browserNotifications|src/types/browserNotifications.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_hooks_useBrowserPushNotifications|src/hooks/useBrowserPushNotifications.ts]] *(from #hook)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
