# Borrador para el README de `main`: calidad del código

> Sección para pegar en el `README.md` del repositorio (por ejemplo, después de «Estructura»), junto con
> `calidad-codigo.mjs`, que va en `scripts/`. Las cifras son de `origin/main` a 11 de octubre de 2026 y se pueden
> repetir con un comando. **Antes de entregar, vuelve a ejecutarlo y actualiza los números.**

## Calidad del código: lo que es verdad y lo que es deuda

No decimos que el código sea perfecto. Decimos que **se puede medir** y que lo que no está bien **está a la vista**.

```bash
node scripts/calidad-codigo.mjs        # tabla en Markdown (añade --json para máquinas)
```

| Qué | Valor |
|---|---|
| Ficheros de código (sin tests) | 1.335 · 280.402 líneas |
| Tamaño típico | mediana de **114 líneas**; el 90 % tiene 503 o menos |
| Ficheros de 300 líneas o menos | **1.065 (80 %)** |
| Ficheros de más de 1.000 líneas | **32**: deuda reconocida (ver más abajo) |
| Cliente que importa del servidor | **0** |
| Servidor que importa componentes de la interfaz | **0** |
| Importaciones circulares (sin contar `import type`) | 5 grupos; el mayor, de 8 ficheros |
| `@ts-ignore` / `@ts-expect-error` | 1 |

### Por qué no es código espagueti

- **Capas con frontera.** El cliente (`src/`) nunca importa del servidor (`server/`), y el servidor nunca importa
  componentes. Está medido, no declarado. Dentro del servidor: `routes/` (HTTP) → `services/` (agentes, scheduler, correo)
  → `db/` (Supabase).
- **Un solo cliente HTTP** (`src/services/api.ts`) para hablar con la API, y un contrato OpenAPI con las 358 rutas.
- **Las reglas que importan están automatizadas,** no escritas en un documento: aislamiento entre bandas, SSRF,
  correo sin aprobación humana y errores de TypeScript tienen un test o un *ratchet* en la CI que impide empeorar.
- **Las decisiones están registradas:** 41 ADR explican por qué es así y qué se descartó.
- **Está probado:** más de 2.000 pruebas unitarias, pruebas E2E con Playwright y regresión visual.

### Lo que no es verdad (y por eso no lo afirmamos)

- **Hay ficheros muy largos.** No existe un límite de líneas por fichero. Los 10 mayores:
  `server/routes/ai_music.ts` (4.184), `server/routes/users.ts` (3.653), `src/db_seed.ts` (1.764),
  `src/components/Atril.tsx` (1.689), `server/routes/leads/enrichment.ts` (1.651), `ExcelImportModal.tsx` (1.620),
  `SongTransitionPreviewModal.tsx` (1.597), `src/types.ts` (1.583), `server/routes/concert_to_album.ts` (1.567) y
  `LoginModal.tsx` (1.460). Casi todos son rutas de servidor que crecieron por funcionalidades y pantallas
  muy completas; ninguno es un enredo de dependencias, pero **son difíciles de leer enteros**.
- **Hay muchos `any` explícitos** (unos 2.000) pese a `strict`. Es la deuda de tipos más grande del proyecto.
- **Quedan 5 grupos de importaciones circulares**, sobre todo del patrón *Provider/Context* de React.
- **El número de pruebas de este README puede ir por detrás del código:** `npm run verify:docs` lo comprueba.

### Cómo se paga esta deuda (plan)

1. Partir `ai_music.ts` y `users.ts` por dominio, empezando por lo que más cambia.
2. Añadir a la CI un *ratchet* de tamaño: ningún fichero puede crecer más de lo que mide hoy, y la lista de ficheros
   de más de 800 líneas solo puede acortarse.
3. Reducir los `any` por carpetas, con el mismo mecanismo de *ratchet* que ya usa ESLint.
