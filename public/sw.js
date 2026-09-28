// Service worker mínimo, deliberadamente sin caché.
//
// Un SW que cachea el shell o los bundles hasheados de Vite es fácil de hacer mal: si cachea
// index.html o los JS/CSS con hash, un usuario puede quedarse "atascado" en una versión vieja
// de la app tras un despliegue, pidiendo assets que el servidor ya no sirve. Hasta que eso se
// diseñe y se pruebe con cuidado (versionado de caché, network-first para HTML/API,
// cache-first SOLO para assets con hash), este SW no cachea nada: solo existe para que Chrome
// considere la app "instalable" desde el móvil. Cero riesgo, cero beneficio de offline todavía.
const CACHE_NAME = "bandmanager-shell-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return Promise.resolve(false);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Network-First con fallback a caché:
// En vivo siempre se intenta la red para garantizar que los despliegues se actualicen al instante
// sin servir bundles rotos. Si la conexión se pierde en camerinos o sótanos, la caché responde.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  // Las llamadas API nunca se cachean en el SW para garantizar consistencia en tiempo real
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && (networkResponse.type === "basic" || networkResponse.type === "cors")) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {});
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(event.request);
        if (cached) return cached;
        if (event.request.mode === "navigate") {
          const cachedHome = await cache.match("/");
          if (cachedHome) return cachedHome;
        }
        return new Response("Sin conexión (Modo Escenario Offline)", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      })
  );
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
