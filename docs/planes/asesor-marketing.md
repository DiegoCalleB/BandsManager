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
| 4. **Estrategia** | ¿Qué queremos y qué podemos? | 🆕 **Falta** | Nueva columna `estrategia_marketing` |
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
Va en `registered_bands.estrategia_marketing` (JSONB), con saneador propio como `sanearAdn`, compartido por cliente y servidor.

### 2.2 Capa de situación: diagnóstico automático (determinista, sin IA, gratis)
La función pura `diagnosticar(banda, hoy)` devuelve **un modo** y su porqué:

| Si… | Modo | El asesor prioriza |
|---|---|---|
| Hay un bolo en ≤ 21 días | 🎫 Concierto | Campaña de hitos y QR de entradas |
| Hay un lanzamiento en ≤ 30 días o han pasado ≤ 14 días | 💿 Lanzamiento | Teasers, presave y "la historia de la canción" |
| Llevan más de 10 días sin publicar | 🔁 Reactivar | 1 pieza fácil y de bajo esfuerzo |
| Las métricas caen 3 semanas seguidas | 🚑 Rescate | Cambiar de formato y probar lo opuesto |
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
- [ ] `EstrategiaMarketing`: tipo, saneador, migración y su test.
- [ ] `diagnosticar()`: función pura y tests de cada modo.
- [ ] Pantalla con las pestañas Hoy y ADN, y onboarding de estrategia prerrellenado con IA.
- [ ] Hoy reutiliza `campanaConcierto` en modo Concierto.

### Fase 2 · Las piezas
- [ ] `format-rules.json` a partir de los apuntes del máster.
- [ ] Generación de carrusel, stories, guion de reel y evento de FB con el contexto ADN.
- [ ] Render PNG de stories y carruseles con el ADN visual.
- [ ] `Hecho` / `Saltar` y aprendizaje de pesos.

### Fase 3 · El bucle
- [ ] Métricas para todos los formatos y resumen semanal unificado.
- [ ] Chat del asesor.
- [ ] Eval del intercambio.
- [ ] Publicación con `socialPublisher`.

---

## 5. Pendiente de Diego
- Apuntes: IG (creación de contenido y algoritmo) y TikTok (algoritmo y SEO, y estrategia), para `format-rules.json`.
- Validar las 6 preguntas de estrategia, que son el corazón de la personalización.
