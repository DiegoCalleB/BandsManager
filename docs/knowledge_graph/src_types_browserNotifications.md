---
id: src_types_browserNotifications
title: "src/types/browserNotifications.ts"
layer: service
domain: system
file: "src/types/browserNotifications.ts"
tags: ["service", "system", "auto"]
---

# 📌 src/types/browserNotifications.ts

> **Ubicación:** `src/types/browserNotifications.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: NotificationPermissionStatus, BrowserNotificationConfig, NotificationCategory, NotificationHistoryItem, DEFAULT_NOTIFICATION_CONFIG.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_components_notifications_NotificationCenterBell|src/components/notifications/NotificationCenterBell.tsx]] *(from #frontend)*
- [[src_components_notifications_NotificationSettingsModal|src/components/notifications/NotificationSettingsModal.tsx]] *(from #frontend)*
- [[src_hooks_useBrowserPushNotifications|src/hooks/useBrowserPushNotifications.ts]] *(from #hook)*
- [[src_services_browserNotificationService|src/services/browserNotificationService.ts]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
