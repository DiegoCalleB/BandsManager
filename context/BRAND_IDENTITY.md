# 🎨 Brand Identity - BandManager.io

> Documenta la identidad de marca ya implementada (colores, tipografía, logo, tono),
> a partir del Brand Book generado por Pomelli el 2026-09-18. Es documentación, no
> una dirección nueva: Pomelli auditó la web ya construida y describió lo que
> encontró — coincide con lo que ya está en código, referenciado más abajo.

---

## 1. Logo

- **Símbolo:** una "B" en degradado ámbar, con un ecualizador de audio integrado
  en el trazo izquierdo y la silueta de una multitud de concierto dentro del hueco
  de la letra. Una estrella/destello arriba a la derecha.
- **Wordmark:** `BANDMANAGER.io` — "BANDMANAGER" en blanco, ".io" en ámbar.
- **Tagline:** "La plataforma integral para tus bandas".
- **Espacio de seguridad:** 105 px alrededor del logo como mínimo.
- **Tamaño mínimo:** 152 px de ancho (1.58"). Por debajo se pierde legibilidad.
- **Assets en el repo:** `public/bandmanageriodefinitiva.jpeg` (versión estática),
  `public/login-animation.mp4` / `.webm` (versión animada: ecualizador pulsando,
  focos de escenario barriendo, partículas doradas subiendo — usada en la
  ventana de login, `src/components/LoginModal.tsx`).

## 2. Tipografía

- **Primaria:** [Inter](https://fonts.google.com/specimen/Inter) — ya es la
  fuente base de toda la app.
  - Definida en `src/index.css` (`--font-sans-current`, `--font-display-current`),
    con fallback a Helvetica Neue / Helvetica / Arial.

## 3. Paleta de colores

| Nombre         | Hex       | Uso principal                                      |
|----------------|-----------|-----------------------------------------------------|
| Jet Black      | `#09090B` | Fondo general de la app (modo oscuro)               |
| Dijon Yellow   | `#F2CA50` | Color de marca / acento (botones, bordes, highlights)|
| Obsidian Black | `#111116` | Fondo de tarjetas y modales                          |
| Pure White     | `#FFFFFF` | Texto sobre fondo oscuro, wordmark "BANDMANAGER"     |

Ya en uso en `src/utils/theme.ts`, `src/components/LoginModal.tsx`,
`src/components/SimplePromoLoginModal.tsx` y en general en toda la interfaz
(el ámbar `#f2ca50`/`#d1b375` es el acento que aparece en botones primarios,
bordes activos y estados seleccionados en prácticamente todos los módulos).

## 4. Voz de marca

- **Valores:** privacidad y seguridad ("Secure encrypted access, 100% private
  data from your band").
- **Estética:** *Obsidian Stage Glow* · *Golden Audio Accents* · *High-Contrast
  Tech* · *Sleek Night-Mode* · *Backstage Energy* — negro profundo, acentos
  dorados brillantes, alto contraste, energía de backstage/concierto.
- **Tono de voz:** profesional, directo, seguro.

## 5. Cómo usar este documento

- Antes de introducir un color, fuente o estilo nuevo en la interfaz, comprueba
  aquí si ya existe un equivalente en la paleta — evita que se cuelen colores
  sueltos fuera de esta identidad (ver `UI_UX_GUIDELINES.md` para patrones de
  layout, este archivo es solo para identidad visual).
- Si algún componente se desvía de esta paleta/tipografía sin una razón de
  producto explícita, es candidato a alinear.
- El PDF original del Brand Book (Pomelli) lo tiene Diego; este `.md` es el
  resumen versionado y con contexto de dónde vive cada pieza en el código.
