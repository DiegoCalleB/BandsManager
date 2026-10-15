# E2E con Playwright

Suite mínima (no cobertura completa): comprueba que la app arranca, que se puede entrar y que los
recorridos críticos y las superficies públicas responden. Corre contra el servidor de desarrollo
(`npm run dev`, Express + Vite en un proceso) **sin credenciales** de Supabase, Stripe ni Gemini: la app
arranca igual y el login funciona con los usuarios semilla de `src/db_seed.ts`.

## Qué hay

| Fichero | Qué comprueba |
|---|---|
| `health.spec.ts` | El healthcheck (`/api/health`) responde. |
| `auth.spec.ts` | Sin sesión sale la landing; con un usuario semilla se llega al panel. |
| `epk-public.spec.ts` | El EPK público no exige login. |
| `onboarding-journey.spec.ts` | Una banda nueva se registra, ve la bienvenida y llega al panel. |
| `dashboard-tirador.spec.ts` | Redimensionar widgets con el tirador y con el teclado; en móvil no hay tirador. |
| `setlist-ajustes.spec.ts`, `setlist-mis-dudas.spec.ts`, `setlist-impreso.spec.ts` | Ajustes, dudas e impresión del setlist. |
| `superficies-publicas.spec.ts` | `robots.txt`, `sitemap.xml`, enlaces cortos y 404 de conciertos. |

No hay regresión visual: no existe ningún proyecto `visual` ni capturas de referencia.

## Cómo ejecutarlos

```bash
npm run test:e2e                          # todo
npx playwright test e2e/auth.spec.ts      # un fichero
```

Playwright arranca el servidor solo (`reuseExistingServer` fuera de CI). Con `E2E_BASE_URL` apunta a
otro servidor ya levantado y no arranca el suyo.

### Si Playwright no encuentra su navegador

`@playwright/test` busca un `chrome-headless-shell` de su propia revisión y en algunos entornos (por
ejemplo, los remotos con Chromium preinstalado) esa revisión no coincide y no se puede descargar.
Apunta al Chromium que ya tengas con la variable `PLAYWRIGHT_CHROMIUM_EXECUTABLE`:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/ruta/a/chrome npx playwright test e2e/dashboard-tirador.spec.ts
```

La variable solo cambia el binario; en CI no hace falta y no se define.

## Convenciones

- Selectores estables: `getByRole`, `getByPlaceholder` o texto visible, nunca clases de Tailwind.
- El idioma se fija en `es-ES` (`playwright.config.ts`) para que los textos no dependan de la máquina.
- Cada prueba que necesita sesión inicia sesión por la interfaz; no hay un `storageState` compartido.
