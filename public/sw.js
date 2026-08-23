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
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
