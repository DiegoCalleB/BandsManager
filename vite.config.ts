import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {configDefaults} from 'vitest/config';
import fs from 'fs';

const { version } = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf8'));
const coverageThresholds = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'coverage-thresholds.json'), 'utf8'));

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    // Versión de package.json (la mantiene release-please) disponible en el cliente.
    define: {
      __APP_VERSION__: JSON.stringify(version),
    },
    test: {
      // e2e/*.spec.ts son tests de Playwright, no de Vitest - el include por defecto de Vitest
      // (**/*.spec.ts) los pillaba igual y explotaba porque usan el test() de @playwright/test.
      exclude: [...configDefaults.exclude, 'e2e/**', '.claude/**'],
      // Umbral de cobertura que solo sube (ratchet): el suelo vive en coverage-thresholds.json (la
      // cobertura real del 2026-10-11) y `npm run coverage:ratchet` lo sube tras mejorarla. Commitea
      // ese cambio; no lo bajes a mano para que pase un PR.
      coverage: {
        provider: 'v8' as const,
        include: ['src/**', 'server/**'],
        reporter: ['text-summary', 'json-summary'],
        thresholds: coverageThresholds,
      },
    },
    esbuild: {
      legalComments: 'none' as const,
    },
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      target: 'esnext',
      sourcemap: false,
      reportCompressedSize: false,
      // Minificado con esbuild (el de Vite por defecto): antes estaba apagado sin motivo escrito y
      // cada JS viajaba sin minificar, lo que pesa en móvil con mala cobertura (sala de ensayo).
      // Sin mapas de código públicos: servirlos expondría el código fuente (PRIVATE-CORE.md).
      minify: 'esbuild' as const,
    },
    server: {
      hmr: false as const,
      ws: false as const,
      watch: null,
      allowedHosts: true as const,
    },
    preview: {
      allowedHosts: true as const,
    },
  };
});
