---
name: fullstack-ux-design
description: Guía de ingeniería Frontend (React 19, Motion, Tailwind v4) y Backend (Express modular, Vitest) para BandManager.io. Usar al crear componentes UI o refinamientos API. Para TODA decisión estética —color, tipografía, sombras, temas— la autoridad es `visual-identity`, no este documento.
---

# ⚙️ Skill: Ingeniería Fullstack (Frontend + Backend)

Esta skill cubre **cómo se construye** el código: estructura de componentes, animación, consumo de API, resiliencia de handlers y tests.

> ## ⚠️ Esta skill NO decide la estética
> Color, tipografía, sombras, radios, temas y cualquier `className` visual se rigen por **[`visual-identity`](../visual-identity/SKILL.md)**. Cárgala antes de tocar UI.
>
> **Nota histórica, no la repitas:** hasta septiembre de 2026 este documento prescribía «Dark Mode Elegante» con fondos `#0f172a`/`#1e293b`, glassmorphism `backdrop-blur-md bg-slate-900/80`, degradados `from-purple-500 to-indigo-600` y semántica de color esmeralda-éxito / ámbar-aviso. Cada agente de IA que leyó el repo obedeció, y el resultado medible fue 2.711 `font-mono`, 154 `backdrop-blur`, 209 degradados, 138 `animate-pulse` y 5 escalas de gris conviviendo: una app que parecía un panel de trading de criptomonedas. Aquello se retiró a propósito. **Si ves ese patrón en el código, es deuda, no un ejemplo a seguir.**

---

## 💎 1. Frontend (React 19 + Tailwind v4)

### Componentes
- **Todo color y toda fuente salen de tokens** (`src/styles/tokens.css`). Cero hexadecimales literales, cero `dark:` en el marcado.
- **Variantes con `cva` + `tailwind-merge`**, no con cadenas ternarias de clases. Las primitivas viven en `src/components/ui/`.
- **Estados de carga y vacíos obligatorios** en toda tabla o grid. El estado vacío tiene voz propia (ver §3 de `visual-identity`), nunca «No hay datos».
- **Sin placeholders de relleno.** Datos reales o generados con sentido.
- **Consumo de API centralizado:** siempre `src/services/api.ts` o `src/utils/api.ts`. Nunca `fetch()` directo desde un componente.

```tsx
import { motion } from 'motion/react';

export function CardMetrica({ titulo, valor, serie }: Props) {
  return (
    <motion.div
      whileHover={{ translateY: -1 }}
      transition={{ duration: 0.15 }}
      className="p-5 border border-[--line] bg-[--surface]"
    >
      <h5 className="font-mono text-[10px] uppercase tracking-wide text-[--ink-3]">{titulo}</h5>
      <p className="font-display text-3xl tabular-nums text-[--ink]">{valor}</p>
      <Onda serie={serie} />
    </motion.div>
  );
}
```

Fíjate en lo que **no** hay ahí: ni `backdrop-blur`, ni `shadow-xl`, ni `rounded-2xl`, ni un color literal, ni `slate`. Y la métrica termina en una `<Onda>`, que es la firma visual del producto.

### Animación (`motion`)
- **Sobria y con función.** Entradas de ~150 ms, hover de 1-2 px, nada de rebotes ni escalados llamativos.
- `animate-pulse` **solo** para carga real, nunca decorativo.
- Toda animación respeta `@media (prefers-reduced-motion: reduce)`.

### Simplicidad en pantalla (AGENTS.md §6 — regla transversal)
Manda sobre cualquier consideración visual cuando entren en conflicto:
- **Móvil primero de verdad**, ~390 px, máximo 3 bloques antes del primer scroll.
- **Acciones secundarias detrás de un menú** (`⋯`/`⚙️`), nunca una fila de botones siempre visible.
- **Ningún componente decorativo sin trabajo que hacer.**
- **Simplificar nunca es borrar funcionalidad** — se reubica (menú, modal, vista secundaria), nunca desaparece en silencio.

---

## 🔧 2. Backend (Express + TypeScript)

### Resiliencia asíncrona
Todo handler asíncrono va envuelto en `try/catch` y devuelve un JSON de error estructurado (`{ error: 'Mensaje descriptivo' }`):

```typescript
app.post('/api/songs', requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const nuevaCancion = await dbCreateSong(req.body, bandId);
    return res.status(201).json(nuevaCancion);
  } catch (error: any) {
    console.error('[API ERROR] /api/songs:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});
```

El `bandId` **siempre** se resuelve con `getTargetBandId(req)` — ver `security-multitenancy`, es innegociable.

### Tipado y calidad (`tsc --noEmit`)
- **Cero errores TypeScript nuevos** sobre el baseline de CI. `npm run build` tipa antes de compilar: un fallo de tipos rompe el build, no solo el lint.
- **Prohibido el `any` indiscriminado.** Interfaz en `src/types.ts` para todo modelo o payload nuevo.

---

## 🧪 3. Pruebas con Vitest

- Tests adyacentes al código, en `__tests__/` (ej.: `server/utils/__tests__/bandAccess.test.ts`).
- `npm test`, o `npx vitest run ruta/al/test.test.ts` para uno concreto.

**Regresión visual:** los cambios de UI se protegen con capturas de referencia de Playwright (`e2e/visual.spec.ts`). Los tests unitarios no comprueban `className`, así que no detectan una rotura de layout — esa red es la de imagen.

---

## ✅ Checklist UX & Backend

- [ ] ¿Has cargado **`visual-identity`** antes de escribir un solo `className`?
- [ ] ¿Todo color y fuente salen de tokens? ¿Cero hexadecimales literales nuevos?
- [ ] ¿Se gestionan los estados de carga y de lista vacía, con voz propia?
- [ ] ¿Toda petición HTTP pasa por `src/services/api.ts`?
- [ ] ¿Las animaciones son sobrias y respetan `prefers-reduced-motion`?
- [ ] ¿El handler asíncrono tiene `try/catch` y resuelve `bandId` con `getTargetBandId`?
- [ ] ¿`npx tsc --noEmit` compila sin errores nuevos?
- [ ] ¿Cabe en 3 bloques el primer viewport móvil (~390 px)? ¿Acciones secundarias tras un menú?
- [ ] ¿Probado en los tres temas (Carga, Directo, Escenario)?
