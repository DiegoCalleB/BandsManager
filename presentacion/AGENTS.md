# AGENTS.md — Presentación del TFM (`presentacion/`)

Estas instrucciones aplican **solo a esta carpeta** y se suman a las del `AGENTS.md` de la raíz (que manda en todo lo que no sea la presentación).

## Objetivo

Esta presentación es la defensa del Trabajo Fin de Máster de Diego en el Máster de Desarrollo con IA de The Big School. La ven Brais Moure y los profesores de la escuela. **El listón es matrícula de honor**: que salgan pensando «esto lo ha hecho alguien que sabe construir producto, no solo prompts».

Cada cambio se juzga con tres preguntas:
1. ¿Un profesor lo entiende en 5 segundos sin que Diego lo explique?
2. ¿Demuestra algo real (código, datos, decisiones) o es solo decoración?
3. ¿Se nota que hay criterio detrás, o parece generado en serie?

Si la respuesta a la 2 o a la 3 es «no», se rehace.

## Narrativa: el hilo son las bandas de Brais

La presentación cuenta una historia con las dos bandas de demo, **Os Herdeiros do Código** y **Master of Prompts**, que son de Brais. Es un recorrido por la vida de una banda, no un catálogo de pantallas. Mantener unas 48 diapositivas (no es una meta a reducir; puede variar según la necesidad), organizadas en actos con nombre:

| Acto | Qué cuenta | Diapositivas |
|---|---|---|
| Tráiler | Apertura de 17 s que arranca sola y termina en el logo | 1 |
| Portada | Gancho: «Menos gestión, más música» | 2 |
| I · Backstage | El caos de gestionar una banda y qué se propone | umbral 2 · 3–5 |
| II · Conseguir el bolo | Booking CRM, agentes, humano en el bucle, Manager, correos | umbral 6 · 7–14 |
| III · Antes del concierto | Calendario, repertorio, Iris, Atril, armonía, ensayos | umbral 15 · 16–24 |
| IV · Que te conozcan | Dossier, QR, fans, reels | umbral 25 · 26–33 |
| V · Después del concierto | Gira, finanzas, móvil | umbral 34 · 35–36 |
| VI · El negocio | Públicos, marketing, planes, márgenes | umbral 37 · 38–46 |
| VII · Bajo el capó | Arquitectura, método, seguridad, calidad, límites, futuro | umbral 47 · 48–53 |
| Telón | Demostración (si hay vídeo) y cierre | 54 |

Reparto aprobado por Diego. Cada acto abre con una diapositiva-umbral (clase `.act`: foto de concierto, número romano en trazo, cortina que se abre y tira de progreso de los 7 actos) y las bandas reaparecen como personajes: la misma banda que sufre en el acto I es la que cierra el concierto en el V.

## Qué se considera impactante aquí

- **Una idea por diapositiva**, una cifra grande o una imagen que ocupe la pantalla. Las viñetas son el último recurso.
- **Movimiento con sentido**: vídeos cortos del producto real y animaciones que expliquen (el prisma de Iris, el contador de la formación), no adornos. Respetar `prefers-reduced-motion`.
- **Producto real, no maquetas**: capturas y vídeos salen de la app corriendo con datos de las bandas de Brais.
- **Las cifras se demuestran**: todo número (tests, endpoints, agentes, pantallas) se saca del repo en el momento y se puede enseñar. Si no se puede comprobar, no se pone.

## Personajes con rostro real

Dos personajes de la demo llevan la cara del CEO de The Big School (imágenes aportadas por Diego): el **manager de Master of Prompts** (`img/personaje-manager.jpg`, actos I, II y V) y el **cantante de Os Herdeiros do Código** (`img/personaje-cantante.jpg`, actos III y IV). Van rotulados «demo», sin nombre ni afirmaciones sobre la persona. Antes de enseñarlos fuera del círculo de la escuela (la presentación en Railway es una URL pública), confirmar con él que está de acuerdo. Si dice que no, se retiran de los umbrales.

## Estilo de escritura (que no suene a IA)

- Castellano natural, frases cortas, voz de quien lo ha construido. Primera persona del plural donde encaje.
- Prohibido: «potente», «revolucionario», «de vanguardia», «ecosistema», «holístico», «seamless», «en el panorama actual», triadas por inercia, signos de exclamación, emojis y guiones largos decorativos.
- Los límites se cuentan con sobriedad y sin disculparse (diapositiva «Lo que falta»). La honestidad suma puntos.
- No inventar nada: ni clientes, ni métricas, ni integraciones, ni fotos de miembros. Si un dato es de demo, la diapositiva lo dice.
- No mencionar Google Sheets: está descartado (ver `AGENTS.md` raíz). Lo que no esté cerrado va a la diapositiva de límites, no a las demás.

## Diseño

- Escenario fijo de **1920×1080** escalado al viewport; modo scroll solo en móvil (≤700 px). Tokens y paleta de `styles.css`, que reutiliza los de la app (sistema Espectro). Tema oscuro por defecto y claro con `T`.
- Imágenes por tema: `l-h-*` (claro) y `d-h-*` (oscuro), con las clases `.l` / `.d`. Móvil: `ml-h-*` / `md-h-*`. Los vídeos temáticos siguen el mismo patrón.
- Animación de entrada con `data-a`; los vídeos ambientales llevan `data-ambient` (y `data-restart` si deben empezar de cero). `deck.js` los pausa al salir de la diapositiva.
- Nada de texto que se salga de la pantalla: el QA de abajo es obligatorio.
- Antes de tocar estilos de la **app**, cargar el skill `visual-identity`. La presentación hereda su estética.

- **Diapositivas «héroe»** (clase `.hero`): la app en grande dentro de un marco con perspectiva y parallax, pines numerados sobre la captura y una leyenda de tres líneas. Titular de menos de ocho palabras. Siempre en escena oscura con la captura `d-h-*`. `.device.full` para capturas con ventana modal (se recorta con `style` en el `<img>` y `aspect-ratio` en `.screen`). Colocar los pines en huecos libres, nunca encima de texto. Las leyendas solo dicen lo que la captura muestra o lo que ya consta en el repo.

- **Sonido** (`sound.js`): todo sintetizado con WebAudio, sin archivos. Apagado por defecto; tecla `M` o botón «Sonido». Transición suave en cada diapositiva, golpe grave y cortina en los umbrales de acto, «tics» en los pines de las héroe y banda sonora propia del tráiler (los tiempos van en `trailerScore` y deben coincidir con los planos del CSS). Si cambias la duración de un plano del tráiler, cambia también su evento de sonido.

- **Entrada y sonido por defecto**: `#gate` es una pantalla de entrada («Empezar con sonido» / «sin sonido») que da el gesto que exige el navegador y arranca el tráiler. Solo aparece al abrir en la primera diapositiva. Rótulo de crédito oficial: «TFM · Máster de Desarrollo con IA · The Big School by Brais Moure».
- **Cifras gigantes** (`.bigstats`): cuatro números enormes con cuenta atrás de entrada y una línea de contexto. Cada cifra se mide en el repo el mismo día (líneas con `wc -l` sobre `src`/`server`, rutas con grep de `router.get|post…`, tablas y migraciones sobre `supabase/`, tests con `vitest`) y la diapositiva lleva la fecha de medición.

## Pipeline de material

- **Capturas y vídeos**: Playwright + Chromium contra la app local (`npm run dev`, puerto 3000), con la API mockeada (`page.route`) y las bandas de Brais. Login de demo y datos de ejemplo, nunca datos reales de clientes.
- **Vídeo**: se graba en WebM y se pasa a MP4 H.264 (`-an`, `-crf 28–30`, `+faststart`). Un vídeo de producto no debería pasar de ~1,5 MB.
- **Límite conocido**: el Chromium de pruebas **no decodifica H.264**; para probar la reproducción real se sirve una copia WebM con `page.route`. Los pósters deben ser el fotograma más representativo.
- **Bucles**: si el vídeo no es cíclico, hacer vaivén (ida y vuelta) o regenerar. Un fundido cruzado se nota.
- **Derechos**: no usar material de terceros reconocible (por ejemplo, portadas de discos). Todo el material visual es propio o de las bandas de demo.
- El servidor de desarrollo no recoge los cambios en caliente de forma fiable: reiniciarlo antes de capturar (`pgrep -f "[t]sx server.ts"` con corchetes para no matar la propia shell).

## QA antes de dar nada por terminado

1. Sin desbordes en 1920×1080: `scrollHeight == clientHeight` en cada diapositiva tocada.
2. Revisadas en **claro y oscuro** y en **modo móvil** (scroll).
3. Los vídeos arrancan, enlazan y respetan la pausa al salir de la diapositiva.
4. Cada cifra y cada afirmación técnica verificada contra el repo.
5. El texto pasa la lista de «estilo de escritura».

## Entrega

- Rama de trabajo `claude/tfm-web-presentation-8uxh6x`. Railway redespliega la presentación en cada push (proyecto «BandManager TFM Presentación»). **Producción de la app (bandmanager.io) despliega desde `main`**: la presentación no la afecta y los cambios de `src/` no llegan allí hasta que se mergeen.
- El **Artifact de claude.ai** (un solo enlace para compartir) se reconstruye y se republica tras cada cambio relevante: HTML con el CSS y el JS inlinados, y las carpetas `img/` y `video/` como archivos aparte. Mantener el conjunto por debajo del límite de tamaño del Artifact.
- Commits en formato convencional (`docs(presentación): …`, `feat(iris): …`); commitlint y lint-staged están activos. No tocar archivos grandes de `src/` sin necesidad: lint-staged revisa el archivo entero y arrastra errores antiguos.
- Pendiente de mejora: el script de montaje del Artifact y los guiones de captura viven fuera del repo. Conviene versionarlos en `presentacion/tools/` para que el proceso sea reproducible.
