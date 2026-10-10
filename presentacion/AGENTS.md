# AGENTS.md — Presentación del TFM (`presentacion/`)

Estas instrucciones aplican **solo a esta carpeta** y se suman a las del `AGENTS.md` de la raíz (que manda en todo lo que no sea la presentación).

## Objetivo

Esta presentación es la defensa del Trabajo Fin de Máster de Diego en el Máster de Desarrollo con IA de The Big School. La ven Brais Moure y los profesores de la escuela. **El listón es matrícula de honor**: que salgan pensando «esto lo ha hecho alguien que sabe construir producto, no solo prompts».

Cada cambio se juzga con tres preguntas:
1. ¿Un profesor lo entiende en 5 segundos sin que Diego lo explique?
2. ¿Demuestra algo real (código, datos, decisiones) o es solo decoración?
3. ¿Se nota que hay criterio detrás, o parece generado en serie?

Si la respuesta a la 2 o a la 3 es «no», se rehace.

## Historia (ficción) que hilvana el recorrido

Rama `claude/tfm-historia-herdeiros`. **Casi toda la presentación se cuenta con el chat de la banda** (decisión de Diego): cada diapositiva es una conversación entre los miembros de **Os Herdeiros do Código** (Brais batería, Xandre voz, Álvaro guitarra, Iago bajo) y, de vez en cuando, el manager (antes cantante de Master of Prompts) y la voz de Master of Prompts. El producto se explica en los mensajes; la pantalla (o el resultado, como la hoja impresa) es la prueba. Hay seis capítulos con un umbral (`.act`) cada uno y un prólogo; después el festival, la radio, el chat espejo y dos diapositivas finales: «El bajista soy yo» y «Y ya estamos pensando en montar un grupo». La diapositiva «Gracias» va justo detrás. No hay diapositiva de portada: el último plano del tráiler ya es la portada (logo, lema y crédito del TFM).

Componente: `<ul class="dlg">` con `<li data-who="bateria" data-t="23:58">Texto</li>`. **Los músicos pueden cambiar**, así que nombres, instrumentos y fotos viven en un único fichero, [`reparto.js`](./reparto.js): las claves son papeles (`bajo`, `bateria`, `voz`, `guitarra`, `manager`, `voz_mop`, `ia_claude`, `ia_gemini`) y el HTML nunca escribe el nombre a mano: usa `{bateria}` (nombre), `{bateria:rol}`, `{bateria:Rol}` o `{bateria:cargo}` en cualquier texto, y `<img data-foto="bateria">` para las fotos. `reparto.js` se carga antes que `deck.js`, sustituye los textos y construye cada mensaje (avatar + burbuja con «Nombre · rol»). Para cambiar a un músico: editar su ficha en `reparto.js` (y la foto en `img/`) y revisar los mensajes con chistes que lo mencionan. «Brais Moure» (el profesor de The Big School) no pasa por el reparto. El bajista, Iago, es siempre el que habla a la derecha (`yo: true`). Los mensajes entran uno a uno (820 ms, `--n` lo fija `deck.js`; el sonido de `sound.js` usa el mismo ritmo) y en modo clics cada clic es un mensaje. En las diapositivas de producto (`.feat.dl`) el chat va a la izquierda y la pantalla a la derecha; en las escenas (`.scene`) el chat ocupa el centro. Máximo ~6 mensajes por diapositiva y títulos de una línea. Los umbrales de capítulo solo llevan el título y un mensaje de Iago.

**Generador.** `index.html` lo escribe entero `tools/guion/generar.py` (a partir de `tools/guion/base.html` y del guion hablado `tools/guion/guion_hablado.py`). No edites `index.html` a mano: el siguiente `generar.py` lo pisaría. Tras cambiar frases habladas, `python3 tools/voces.py --qa`. Antes de subir, `python3 tools/comprobar.py`: falla si alguna frase se queda sin audio o si `deck.js` busca un elemento que ya no existe.

**Voces.** Cada mensaje tiene una versión hablada más rica que la burbuja (`data-say`), y cada personaje su voz en `reparto.js` (`tts`). Los audios los genera `tools/voces.py` (ver [tools/README.md](./tools/README.md)) con ElevenLabs (o modelos libres en local, como respaldo); `voces.js` los reproduce en orden y cada burbuja aparece cuando su personaje empieza a hablar (con el sonido activo; V apaga solo las voces). Cada mensaje sale primero como «escribiendo…» y el avatar de quien habla late con el volumen real de su voz. **Plató:** quien habla en el chat sale además en grande en un hueco libre de la diapositiva (`voces.js` mide lo que hay en pantalla y elige el hueco, de 230 a 120 px; si no cabe, no sale) y se mueve a su manera según su `mov` en `reparto.js` (`bombo`, `diva`, `cabeceo`, `cool`, `calma`), al ritmo de su volumen. Las frases se encadenan con solape: la siguiente arranca cuando a la anterior le quedan ~0,3 s. **Modo cine (P):** además de las bandas de cine y el fondo que se acerca, la cámara empuja despacio hacia el retrato de quien habla (`camara`), cada cambio de plano da un fogonazo (`corte`) y el retrato entra por su lado (los demás por la izquierda, «yo» por la derecha), el resto del chat se apaga, hay viñeta de lente y suena música de fondo (`cine.js`, `audio/musica/rock.mp3`, que genera `tools/musica.py`) que baja sola mientras alguien habla. P activa el modo película: bandas de cine, el fondo se acerca despacio y cada diapositiva pasa sola al terminar de hablar. **Tono hablado:** estrellas del rock de garaje (se creen los Rolling y ensayan en un bajo con humedad): el batería, bestia y cachondo; la voz, diva; la guitarra, guitar hero malhablado; el bajista, el gran olvidado. La burbuja conserva el texto de Diego; el chiste rockero va en `data-say`. **Actuación:** las voces son de ElevenLabs v3 (castellano de España) y `data-say` admite sus etiquetas en inglés, como `[laughs]`, `[sighs]`, `[shouts]`, `[excited]` o `[softly]`: no se pronuncian, se interpretan. Úsalas con moderación, en los golpes de humor. El generador añade `[pause]` al final de cada frase, porque v3 a veces se come la última palabra. Al cambiar una frase o un músico hay que regenerar las voces; las diapositivas finales («El bajista soy yo») no tienen voz a propósito: las dice Diego.

Reglas del guion: el humor sale de las adivinanzas del grupo (Google Calendar, una base de datos de salas), de Iago quitándose mérito y de «tu trabajo de promociones de coches»; las reacciones son de sorpresa y alegría (exclamaciones y algún emoji con sentido); nada de repetir ideas; cada foto de personaje sale como avatar. Solo se prometen funciones que existen o se dicen como idea («mi idea es meterle un Tricount»). Lo que ya existe y debe decirse bien: en **bandas amigas** se escucha un preview de 30 s de sus temas más populares y se ven sus métricas del mes (seguidores en Spotify, suscriptores en YouTube); el **acuerdo** se firma desde un enlace con copia para la sala; la **comisión** por concierto es voluntaria de momento; la suscripción está construida pero desactivada a propósito.

El reparto son los miembros de la demo con sus fotos de `img/miembro-*.jpg`; el bajista del relato se llama Iago y solo al final se revela que quien habla es Diego (foto real `img/diego-bajista.jpg` delante, y el bajista de la historia de fondo, para que salgan los dos bajistas). Claudio y Guglio (los asistentes de IA) son Claude Code y Gemini. Por decisión de Diego las escenas no llevan rótulos de «ficción» ni «demo». La presentación es privada (profesorado del máster); si se hiciera pública, quitar los nombres reales del festival y la radio y confirmar las fotos de los personajes.

## Lo cierto detrás de la historia

Dato aportado por Diego: tocó en varios grupos y los fue dejando porque no iban a ningún lado por falta de organización, gestión y tiempo. Creó BandManager con la esperanza de volver a tocar y sentir lo mejor del mundo: tocar delante de miles de personas y hacerlas disfrutar; y con los tests ya ha empezado a quedar con amigos para tocar. Las dos diapositivas finales lo dicen en primera persona; la de «Esa noche, Iago abrió el portátil» lo sugiere sin explicarlo.

## Narrativa: el hilo son las bandas de Brais

La presentación cuenta una historia con las dos bandas de demo, **Os Herdeiros do Código** y **Master of Prompts**, que son de Brais. Es un recorrido por la vida de una banda, no un catálogo de pantallas. Unas 45 diapositivas (no es una meta a reducir). La estructura narrativa completa (cold open con el festival a las 02:14, dos líneas temporales cruzadas, cuenta atrás «Dadme hasta el sábado», ganchos al cierre de cada capítulo y convergencia final) está en [`GUION.md`](./GUION.md). Es la referencia para ordenar, añadir o quitar diapositivas.

La foto de los cuatro alucinando en el local de ensayo la aporta Diego (`img/local-ensayo.jpg`; hueco: debajo del chat de «Lo han visto todo»). Cada foto de personaje (manager, voz de Master of Prompts) sale como avatar y sin la palabra «cantante» en el pie.

## Qué se considera impactante aquí

- **Una idea por diapositiva**, una cifra grande o una imagen que ocupe la pantalla. Las viñetas son el último recurso.
- **Movimiento con sentido**: vídeos cortos del producto real y animaciones que expliquen (el prisma de Iris, el contador de la formación), no adornos. Respetar `prefers-reduced-motion`.
- **Producto real, no maquetas**: capturas y vídeos salen de la app corriendo con datos de las bandas de Brais.
- **Las cifras se demuestran**: todo número (tests, endpoints, agentes, pantallas) se saca del repo en el momento y se puede enseñar. Si no se puede comprobar, no se pone.

## Personajes con rostro real

Dos personajes de la demo llevan la cara del CEO de The Big School (imágenes aportadas por Diego): el **manager de Master of Prompts** (`img/personaje-manager.jpg`, en el acto II y en la escena «La sala contestó») y el **cantante de Os Herdeiros do Código** (`img/personaje-cantante.jpg`, en el acto IV, la portada y la escena del festival). Van sin nombre ni afirmaciones sobre la persona (el pie solo dice el rol y la banda). Antes de enseñarlos fuera del círculo de la escuela (la presentación en Railway es una URL pública), confirmar con él que está de acuerdo. Si dice que no, se retiran de los umbrales.

## Estilo de escritura (que no suene a IA)

- Castellano natural, frases cortas, voz de quien lo ha construido. Primera persona del plural donde encaje.
- Excepción acordada con Diego: los chats y las reacciones de la banda llevan emojis y exclamaciones, como un grupo de WhatsApp. El resto de la presentación no.
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

- **Sonido** (`sound.js`): todo sintetizado con WebAudio, sin archivos. Apagado por defecto; tecla `M` o botón «Sonido». Transición suave en cada diapositiva, golpe grave y cortina en los umbrales de acto, «tics» en los pines de las héroe y banda sonora propia del tráiler (los tiempos van en `trailerScore` y deben coincidir con los planos del CSS). Si cambias la duración de un plano del tráiler, cambia también su evento de sonido. El personaje del manager aparece solo una vez (acto II) para no repetirlo.

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
