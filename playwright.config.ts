import { defineConfig, devices } from '@playwright/test';
/** Sesión reutilizable que crea e2e/auth.setup.ts (ver allí el porqué).
 *  Ruta relativa a la raíz del repo: el proyecto es ESM y no hay __dirname. */
const FICHERO_SESION = 'e2e/.auth/user.json';

// Smoke suite mínimo (no cobertura completa) - ver e2e/README.md para qué cubre y por qué no
// hay más. Corre contra el servidor de dev (Express + Vite en un solo proceso, ver server.ts)
// arrancado sin credenciales de Supabase/Stripe/Gemini: la app arranca igual y el login
// funciona contra los usuarios semilla de src/db_seed.ts (la sincronización con Supabase en
// /auth/login está en try/catch y sigue con el estado en memoria si falla).
/** El entorno trae Chromium preinstalado y sin descarga: se apunta al binario. */
const LAUNCH_OPTIONS = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
  ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
  : undefined;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 30_000,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // El smoke original: sin sesión previa, porque auth.spec.ts comprueba justo
    // que sin sesión se ve el login. Ignora la suite visual, que tiene su propio
    // proyecto con sesión reutilizada.
    {
      name: 'chromium',
      testIgnore: [/visual\.spec\.ts/, /auth\.setup\.ts/],
      use: {
        ...devices['Desktop Chrome'],
        // El Chromium completo que trae preinstalado el entorno no coincide en revisión con
        // el chrome-headless-shell que @playwright/test intentaría descargar por su cuenta
        // (y aquí no hay descarga de navegadores) - se apunta directo al binario ya presente.
        launchOptions: LAUNCH_OPTIONS,
      },
    },
    // Login único para la suite visual: el backend limita a 10 logins/minuto y
    // un login por test se auto-bloqueaba a mitad de corrida.
    {
      name: 'setup-visual',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'], launchOptions: LAUNCH_OPTIONS },
    },
    {
      name: 'visual',
      testMatch: /visual\.spec\.ts/,
      dependencies: ['setup-visual'],
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: LAUNCH_OPTIONS,
        storageState: FICHERO_SESION,
      },
    },
  ],
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000/api/health',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      NODE_ENV: 'development',
      AGENT_EMAIL_MODE: 'draft',
    },
  },
});
