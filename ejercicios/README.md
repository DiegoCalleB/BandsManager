# Ejercicios del máster

Sitio estático de los ejercicios del Máster de Marketing Digital con IA, aparte de la aplicación.
Se despliega como un servicio propio de Railway con **Root Directory = `/ejercicios`** (Dockerfile + Caddy), igual que [`presentacion/`](../presentacion/). No lleva `noindex` por meta: lo manda la cabecera `X-Robots-Tag` del `Caddyfile`.

| URL | Archivo |
|---|---|
| `/` | `index.html`: índice de ejercicios |
| `/youtube-crm` | `youtube-crm.html`: plan de YouTube «CRM para bandas» |

La barra lateral y el índice salen de un solo listado en `assets/ejercicios.js`: para publicar un ejercicio se le pone su URL allí y se crea la página (con `<script src="/assets/ejercicios.js" defer>` al final).

Añadir un ejercicio: crear `nombre.html` aquí, sus imágenes en `assets/nombre/` y una tarjeta en `index.html`. Las URL se sirven sin `.html`.
