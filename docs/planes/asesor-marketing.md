# Asesor de Marketing (pantalla nueva) · plan v2

> La pantalla de Reels (`src/components/reels_center/`) **no se toca**. El asesor es una pantalla nueva que **reutiliza** lo que ya existe.
> Promesa: **"Cada día sabes qué publicar, dónde y cómo, y suena y se ve como TU banda."**

---

## 1. Lo que ya tenemos (no se reescribe)

| Pieza existente | Dónde | Qué aporta al asesor |
|---|---|---|
| Perfil de banda | `server/utils/bandProfile.ts` (`loadBandProfile`, `buildBandContextBlock`) | Quiénes son: género, ciudad, bio, miembros, redes, instrumentos |
| ADN de voz | `registered_bands.dna_expresion` (`server/db/tiposAdn.ts`) | Cómo hablan: tono, tratamiento, vocabulario, emojis, **matiz por red**, frases de directo, términos a evitar |
| ADN visual | `band_cartel_estilo` (`src/utils/cartel/adn.ts`) | Cómo se ven: referencias, favoritos y estilo, para las plantillas de stories y carruseles |
| Campaña de concierto | `src/utils/campanaConcierto.ts` + `server/routes/campanaConcierto.ts` | Hitos (anuncio, recordatorio, última llamada y día D), plantillas, enlaces cortos y versión con IA |
| Aprendizaje de Reels | `server/services/metricasReels.ts` (`aprendizajeDeBanda`, `resumenSemanalDeBanda`) | Qué ha funcionado de verdad (rewatch, compartidos, guardados) |
| Publicador | `server/services/socialPublisher.ts` | Publicación programada (fase 3) |
| Reglas anti-IA | `server/utils/promptGuidelines.ts` + `promptSafety.ts` | Que no suene a ChatGPT y no haya inyección de prompts |

**Conclusión:** el asesor es sobre todo **orquestación y una capa nueva de estrategia**, no un sistema nuevo.

---

## 2. ¿Cómo se adapta a cada banda? El ADN en 5 capas

| Capa | Pregunta | Estado | Fuente |
|---|---|---|---|
| 1. Identidad | ¿Quiénes somos? | ✅ Existe | `BandProfile` |
| 2. Voz | ¿Cómo hablamos? | ✅ Existe | `dna_expresion` |
| 3. Estética | ¿Cómo nos vemos? | ✅ Existe | `AdnCartel` |
| 4. **Estrategia** | ¿Qué queremos y qué podemos? | ✅ Fase 1 | Tabla `band_estrategia_marketing` |
| 5. Rendimiento | ¿Qué nos funciona? | 🟡 Solo para reels | Generalizar `metricasReels` a todos los formatos |

Y encima, una **capa de situación** que no se guarda: se **calcula cada día** a partir de los datos.

### 2.1 Capa 4: Estrategia (lo único nuevo de verdad)
Seis preguntas en el onboarding. **La IA las rellena primero** con bio, género, Spotify y redes, y la banda solo corrige:

```ts
interface EstrategiaMarketing {
  v: 1;
  objetivo: 'llenar_salas' | 'streams' | 'festivales' | 'comunidad';
  etapa: 'empezando' | 'local' | 'regional' | 'nacional';
  publico: string;                 // "25-40, indie/rock, Madrid, va a salas pequeñas"
  horasSemana: 1 | 3 | 6;          // decide cuántas piezas se proponen
  camara: 'todos' | 'algunos' | 'nadie';  // ¿quién sale hablando a cámara?
  pilares: string[];               // 3 temas propios: "ensayos caóticos", "historias de las letras", "carretera"
  lineasRojas: string[];           // "no bailes de trends", "no política", "no enseñar caras"
  referentes: string[];            // 2-3 artistas cuyo perfil les gusta
}
```
Va en su propia tabla `band_estrategia_marketing` (JSONB, una fila por banda, mismo patrón que `band_cartel_estilo`), con saneador compartido por cliente y servidor (`src/utils/asesor/estrategia.ts`). Incluye además el **próximo lanzamiento** (título y fecha), porque el repo no guarda fechas de lanzamiento en ningún otro sitio.

### 2.2 Capa de situación: diagnóstico automático (determinista, sin IA, gratis)
La función pura `diagnosticar(banda, hoy)` devuelve **un modo** y su porqué:

| Si… | Modo | El asesor prioriza |
|---|---|---|
| Hay un bolo en ≤ 21 días | 🎫 Concierto | Campaña de hitos y QR de entradas |
| Hay un lanzamiento en ≤ 30 días o han pasado ≤ 14 días | 💿 Lanzamiento | Teasers, presave y "la historia de la canción" |
| Llevan más de 10 días sin publicar | 🔁 Reactivar | 1 pieza fácil y de bajo esfuerzo |
| Las métricas caen 3 semanas seguidas | 🚑 Rescate | Cambiar de formato y probar lo opuesto *(hecho: ver «Modo rescate»)* |
| Nada de lo anterior | 🌱 Fondo | Rotar pilares y construir comunidad |

**Por qué determinista:** es explicable ("te propongo esto porque tocas en 9 días"), testeable con Vitest y no cuesta tokens.

### 2.3 Cómo se inyecta el ADN en cada pieza
```
contexto = buildBandContextBlock(perfil)       // capa 1 + 2 (ya existe)
         + bloqueEstrategia(estrategia)          // capa 4
         + bloqueAprendizaje(aprendizaje)        // capa 5: "a vosotros os funciona X, no Y"
         + modo y porqué                         // situación
reglas   = formatRules ∩ estrategia             // filtra formatos incompatibles
```
Las **líneas rojas filtran formatos antes del prompt**, sin confiar en que el modelo obedezca. Si `camara = 'nadie'`, el asesor nunca propone talking heads, solo planos de manos e instrumentos, texto en pantalla o directo grabado.

### 2.4 Cómo aprende (cada interacción afina el ADN)
| Señal | Qué actualiza |
|---|---|
| `Hecho` / `Saltar` | Peso de formatos y pilares: lo que siempre se salta deja de proponerse |
| Edición del copy por la banda | `dna_expresion.reglas_estilo_aprendidas` (mismo mecanismo que el pitch) |
| Métricas a las 48 h | Capa 5 por formato y pilar |
| Resumen semanal | Le propone a la banda cambiar la estrategia ("tu pilar 'carretera' triplica guardados") |

Mismo patrón que el `aprender` de los carteles: **la banda decide; el sistema sugiere**.

### 2.5 Cómo sabemos que funciona: el "test del intercambio"
Un eval en `scripts/evaluar-agentes.ts`: generamos la misma pieza para 2 bandas muy distintas y **cambiamos los nombres entre ellas**. Si un juez LLM no sabe distinguir cuál es de quién, el contenido es genérico y suspende. Es la métrica de ADN para el TFM.

---

## 3. La pantalla
- **Hoy**: el modo actual con su porqué y de 1 a 3 tarjetas con formato, plataforma, hora y esfuerzo, más `Hecho` y `Saltar`.
- **Campañas**: se **amplía la campaña de concierto que ya existe** (hitos y textos) añadiendo formatos: carrusel, secuencia de stories, guion de reel y evento de Facebook. Además, campañas de lanzamiento y de fondo.
- **ADN**: las 5 capas en una sola vista. Las capas 1 a 3 se ven y enlazan a donde ya se editan; la capa 4 se edita aquí; la capa 5 es solo de lectura.
- **💬 Asesor**: chat con todo ese contexto.

UI siguiendo la skill `visual-identity` (Espectro) y con color de módulo propio.

---

## 4. Fases

### Fase 1 · El cerebro (sin IA nueva, todo testeable)
- [x] `EstrategiaMarketing`: tipo, saneador, migración y su test.
- [x] `diagnosticar()` y `tarjetasDeHoy()`: funciones puras y tests de cada modo.
- [x] Rutas `/api/asesor/*` (hoy, estrategia, propuesta con IA) con tests de aislamiento por banda.
- [x] Pantalla «Asesor de marketing» (menú Promoción) con las pestañas Hoy y Estrategia, y borrador prerrellenado con IA.
- [x] Hoy reutiliza los hitos de `campanaConcierto` en modo Concierto y lleva a la Cartelería del bolo.

### Fase 2 · Las piezas
- [x] Reglas de formato con la fuente de cada una (`src/utils/asesor/reglasFormato.ts`) y diagnóstico de métricas (`src/utils/asesor/diagnosticoMetricas.ts`), a partir de los apuntes del máster.
- [x] Varias ideas por día para elegir (`src/utils/asesor/opciones.ts`): las recomendadas según el tiempo de la banda y hasta 3 «otras ideas».
- [x] «Preparar pieza»: la IA escribe reel, carrusel, stories o post con el ADN (identidad, voz, estrategia y reglas del formato), saneada en `src/utils/asesor/pieza.ts`. El cliente solo manda el id de la idea.
- [x] `Hecho` / `Saltar` (tabla `asesor_acciones`) y aprendizaje: el formato que una banda salta más de lo que hace baja puestos (sin tocar los hitos del bolo).
- [x] La semana en la Onda y e2e a 390 px en los tres temas (`e2e/asesor.spec.ts`).
- [ ] Evento de Facebook como formato propio (hoy el post de Instagram cubre el anuncio).
- [x] **El ADN de la banda en las imágenes y en el texto.** Las imágenes arrancan con su estilo: la letra sale de su estilo visual (lo que más comparte en Cartelería, la plantilla de su dossier o su género), las fotos de su galería del dossier (más las referencias y los fondos que ha compartido) se usan de fondo (en las stories cada pantalla lleva una; en el carrusel, la portada) y se pueden cambiar con un toque (`src/utils/asesor/adnVisual.ts`). El texto añade lo que el sistema ya aprendió de cómo quiere sonar: términos a evitar y reglas suyas (`vozAprendida.ts`, el mismo `dna_expresion` que usan los pitches) y el tono propio de cada red. Un término prohibido no se confía solo al prompt: se comprueba en la respuesta y se reintenta una vez.
- [x] Las stories y los carruseles salen ya como imágenes (1080×1350 y 1080×1920) con el ADN visual: colores y logo de la banda, letra a elegir, foto de fondo opcional por imagen con la legibilidad garantizada, y un ritmo distinto para portada, pasos y cierre (`src/utils/asesor/laminas.ts`, `renderLaminas.ts`). Se pintan en el navegador: no cuestan IA y las fotos no salen del dispositivo.

### Fase 3 · El bucle
- [x] **El bucle de aprendizaje (versión manual).** Dos días después de marcar una pieza como publicada, la pestaña Resultados pide tres números de las estadísticas de Instagram (alcance, guardados y, opcional, cuentas que no seguían) y da la lectura de esa pieza: si falla el valor o el descubrimiento (`diagnosticoMetricas.ts`, lección de métricas clave). Con dos piezas medidas sale un resumen (las que mejor y peor fueron y qué formato os guarda más) y el plan de hoy sube los formatos que funcionan y baja los que no (`resumen.ts`). Los hitos de un bolo no se mueven. Migración `20261124_asesor_resultados.sql`.
- [ ] Métricas automáticas por la API de Instagram (hoy se anotan a mano, 20 segundos por pieza).
- [ ] Chat del asesor.
- [ ] Eval del intercambio.
- [ ] Publicación con `socialPublisher`.

---

## 5. Pendiente de Diego
- ~~Apuntes del máster~~ ✅ integrados.
- Validar las 6 preguntas de estrategia, que son el corazón de la personalización.

## Métricas desde Instagram (pieza A)

- [x] «Traer de Instagram» en cada pieza por medir: lista las publicaciones del mismo día (o el siguiente), la banda elige y se rellenan alcance, guardados y no seguidores. Siempre editable antes de guardar; solo lee.
- [x] Con el token de la propia banda; el id elegido debe estar entre sus publicaciones recientes.
- [x] Las stories quedan fuera: a las 48 h Instagram ya no las devuelve.
- [ ] PENDIENTE: validar los nombres de las métricas (`reach`, `saved`, `breakdown=follow_type`) con la cuenta de Ruta 66.
- [ ] Aviso de Meta: para otras bandas hace falta la revisión de la app (`instagram_manage_insights`).

## Calendario (pieza B)

- [x] Pestaña «Calendario»: agenda de tres semanas (7 días atrás, 14 adelante) solo con los días que tienen algo, y hoy siempre.
- [x] Pone lo fijado (bolos, hitos de su campaña, estreno) y lo ya publicado con la lectura de sus números («Funcionó», «Sin medir»…). Lógica pura en `src/utils/asesor/agenda.ts`.
- [ ] No planifica publicaciones futuras ni se arrastra nada: qué publicar cada día sigue decidiéndolo la pestaña «Hoy». Reservar ideas por día queda para una fase posterior.

## Modo rescate

- [x] Se activa tras un bolo o un estreno (que siguen mandando) y antes de «volver a publicar». Lógica pura en `src/utils/asesor/rescate.ts`, sobre los resultados que la banda ya anotó.
- [x] Dos señales: tres semanas seguidas con menos alcance medio (la última por debajo del 70 % de la primera) o las tres últimas piezas medidas sin arrancar. Sin datos de las tres semanas no se inventa ninguna caída.
- [x] Propone probar lo opuesto al formato que no arranca (reel ↔ carrusel), repetir la estructura de la pieza que más se guardó y preguntar a los seguidores qué quieren ver.
- [x] Cabecera «Cambiar de rumbo» y la misma validación de ideas por id en el servidor que el resto de modos.
- [ ] Pendiente: aviso al salir del rescate («ya vuelve a subir») y que la IA compare qué cambió entre la mejor y la peor semana.
