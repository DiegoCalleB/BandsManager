import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Config mínima y honesta: un solo navegador (Chromium, ya viene preinstalado en CI/sandbox)
// y un único worker en CI para evitar flakiness por servidor compartido. Ampliar a
// firefox/webkit y más workers es trivial cuando el equipo lo necesite.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // El sandbox trae un Chromium preinstalado que puede no coincidir con la versión
        // exacta que @playwright/test espera descargar. Si existe, lo usamos directamente
        // en vez de intentar bajar uno nuevo (sin red no haría falta tocar esto en local).
        launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
          ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
          : undefined,
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
