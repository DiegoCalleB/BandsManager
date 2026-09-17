// Service worker mínimo, deliberadamente sin caché.
//
// Un SW que cachea el shell o los bundles hasheados de Vite es fácil de hacer mal: si cachea
// index.html o los JS/CSS con hash, un usuario puede quedarse "atascado" en una versión vieja
// de la app tras un despliegue, pidiendo assets que el servidor ya no sirve. Hasta que eso se
// diseñe y se pruebe con cuidado (versionado de caché, network-first para HTML/API,
// cache-first SOLO para assets con hash), este SW no cachea nada: solo existe para que Chrome
// considere la app "instalable" desde el móvil. Cero riesgo, cero beneficio de offline todavía.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Este SW nunca escribe en caché (ver comentario de arriba), pero una versión anterior sí
  // pudo hacerlo antes de este cambio. Purgar aquí asegura que nadie se quede sirviendo un
  // bundle viejo desde una caché huérfana, y que las actualizaciones se apliquen al instante
  // sin pedirle al usuario que borre datos del navegador a mano.
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))),
      self.clients.claim(),
    ])
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow("/");
      }
    })
  );
});
