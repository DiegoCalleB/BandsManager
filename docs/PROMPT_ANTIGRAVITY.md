# Prompt urgente para Antigravity — lo que falta del rediseño de BandManager

Copia todo lo de abajo en Antigravity. Rama de trabajo: `claude/espectro-craft`.

---

## Contexto

BandManager es la app definitiva para grupos de música (booking, repertorio/setlists, calendario, fans, EPK, finanzas, giras, reels). Es el TFM de Diego. Estamos terminando un rediseño visual y de UX llamado **Espectro**. Casi todo está hecho; tu trabajo es cerrar lo que falta **con el mismo criterio** con el que se ha hecho el resto.

## Lee esto ANTES de tocar nada (por orden)

1. `AGENTS.md` (raíz): manda sobre cualquier convención genérica.
2. `.claude/skills/visual-identity/SKILL.md`: autoridad estética. **Cárgala antes de escribir un solo `className`.**
3. `.claude/skills/craft-interfaces/SKILL.md` y `.claude/skills/fullstack-ux-design/SKILL.md`.
4. `BACKLOG.md`: lista viva de deuda y siguientes pasos.
5. `src/styles/tokens.css` y `src/components/ui/` (primitivas): reutilízalas, no inventes otras.

## Reglas inviolables (las rompe cualquiera que improvise)

- **Cero `border`.** La separación es escalón de luminancia (`--surface` sobre `--bg`) y espacio.
- **Un solo acento azul** y pocos colores. Nada de colores nuevos por módulo en botones: la selección es **neutra** (variante `selected`/`neutral`), `primary` solo para la acción principal de la pantalla.
- **Todo sale de tokens**: cero hex literales, cero `dark:` de Tailwind, solo escala de gris `neutral`. Sin `backdrop-blur`, degradados, glows, ni `animate-pulse` decorativo.
- **Radios por peso** (`--r-pill/s/m/l/xl`), nunca un radio único para todo.
- Caja de frase (sin mayúsculas decorativas); `font-mono` solo en dato tabular real.
- **Datos en «Onda»**: series como curvas/barras redondeadas con `CurveSeries`/`Onda`. Nada de librerías de gráficos.
- **Tres temas obligatorios**: claro, oscuro y **Clásico** (innegociable, no se borra). Todo se prueba en los tres.
- **Móvil primero (~390 px)**: máximo 3 bloques antes del primer scroll; acciones secundarias detrás de `⋯` (`ActionMenu`); barras de acción fijas con `@utility pin-top`. Simplificar **nunca** es borrar funcionalidad: se reubica.
- **Modales siempre con `ModalPortal`** (y `dvh` en móvil). Un modal sin portal se queda sin poder cerrarse en móvil: ya pasó.
- Estados vacíos con voz de directo (ni «No hay datos»). Copy de músico de furgoneta, no de jefe de producto.
- API siempre por `src/services/api.ts` o `src/utils/api.ts`; `bandId` siempre con `getTargetBandId(req)` en servidor.

Primitivas existentes: `Button` (variantes `primary`, `soft` rara, `neutral`, `ghost`, `danger`, `selected`, `inverse`, `raised`), `Tabs` (`layout="fill"|"scroll"`), `ActionMenu`, `ChannelChip`, `CurveSeries`, `Field/Input/Select/Textarea`, `Card`, `EmptyState`, `Toast`, `ModalPortal`.

## Qué falta (en orden de prioridad)

### 1. F4 · Migración por módulos a las primitivas (en curso)
- **Finanzas, Giras y Reels**: añadir barra fija en móvil (`pin-top`), pasar acciones secundarias a `ActionMenu`, botones a las variantes correctas, gráficos a `CurveSeries`.
- **Grupos**: bajar la densidad de las tarjetas en móvil (Marie Kondo: qué información necesita un músico o un manager de un vistazo).
- **Booking móvil**: quitar el ruido de chips «Sin datos».
- **Reels / Fans (tarjetas de plataformas)**: arreglar el solape de insignias y los títulos en rojo (el rojo es solo `--alert` para errores reales).

### 2. F7 · Crítica visual con datos reales
- Revisar cada pantalla en **Clásico**, con datos reales de Ruta 66 y con la **prueba de 200 px** (un recorte de 200 px debe reconocerse como BandManager).

### 3. Barrido de modales sin portal (~35)
- Envolver en `ModalPortal` los que quedan (lista en `BACKLOG.md`, sección «deuda de modales sin portal») y comprobar que se cierran en móvil. Hay un test de referencia: `e2e/modal-uniones.spec.ts`. Copia ese patrón para los nuevos.

### 4. Landing pública (`src/components/PublicLanding.tsx`)
- **Añadir sección «Setlists personalizados para cada miembro»**: cada músico tiene sus notas por tema, nivel de preparación (aprendiendo / casi lista / lista) y se imprime una hoja por músico (o master para sonido). Funciones reales: `Song.notasPorMiembro`, `MemberNotesModal`, `PdfExportModal`. Capturas ya definidas en `e2e/landing-capturas.spec.ts` (`miembros-*.jpg`, `hojas-*.jpg`); falta **generarlas** y colocarlas en la sección (+ mención en hero/FAQ).
- Generarlas: `LANDING_SHOTS=1 npx playwright test --project=visual landing-capturas`. En este entorno Chromium puede estar en otra ruta: `export PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`. El login tiene rate-limit de 10/min: si falla, espera y repite.
- **Bandas de demo**: Diego quiere bandas **inventadas con guiño a mouredev** (humor de dev, p. ej. *Null Pointer*, *Merge Conflict*, *Git Push --force*), **sin usar nombre, cara ni logo de Brais Moure** y con crédito en el pie «Proyecto final del Máster de Desarrollo con IA · The Big School». Edita `e2e/fixtures/demoBand.ts` y `scripts/landing/generar-demo-assets.mjs` (retratos ilustrados SVG). **Confirma con Diego nombres y opción** antes de cambiarlo.
- Pendiente además: versión en inglés, SEO y páginas legales.

### 5. Fase 2 de limpieza de servidor (solo si sobra tiempo)
- Eventos sin `band_id` = Bakandeya, `isBraisUser`, claves `bakandeya_token`: hardcode a eliminar con cuidado (multi-tenant, ver skill `security-multitenancy`).

## Cómo trabajar (obligatorio)

- Una fase = un commit pequeño y revisable; mensaje claro; push a `claude/espectro-craft` (Railway «Promo» despliega solo al pushear).
- Antes de cada push, **todo en verde**:
  - `npx tsc --noEmit`
  - `npx vitest run`
  - `npm run audit:diseno` (y `npm run audit:contraste`)
  - Playwright: `npx playwright test --project=visual --project=chromium`
- **Mira las capturas tú mismo** (abre la imagen), en claro, oscuro y Clásico, en 390 px y 1280 px. Un test verde no prueba que se vea bien.
- Si cambias a propósito el aspecto de una pantalla, actualiza los snapshots (`visual.spec.ts-snapshots`, `-dark`) y dilo en el commit.
- Contraste: texto sobre acento usa `--acc-ink`/`--on-acc`; `--ink-3` no vale para texto que importa (usa `--ink-2`).
- No hagas PR, no toques `main`, no añadas librerías sin avisar. No añadas reglas a `CLAUDE.md`: van en `AGENTS.md`.
- Tono con Diego: directo, honesto y crítico; da **opciones**, no una única respuesta; si algo es mala idea, díselo.

## Definición de «hecho»

Pantalla perfecta en móvil y escritorio, en los tres temas, sin bordes, con un solo acento, con primitivas, con estados vacíos con voz propia, modales cerrables en móvil y todos los checks en verde. Actualiza `BACKLOG.md` con lo que quede.
