import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// defineConfig viene de vitest/config (no de vite) para que TypeScript reconozca
// también la propiedad `test` de Vitest en este mismo fichero de configuración.
import {configDefaults, defineConfig} from 'vitest/config';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
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
      minify: false,
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
    test: {
      // Los tests existentes (lógica pura en server/ y src/utils) corren en 'node' por defecto,
      // rápido y sin DOM. Los tests de componentes React (*.test.tsx) que sí necesitan DOM
      // activan jsdom por fichero con el pragma `// @vitest-environment jsdom`.
      environment: 'node',
      setupFiles: ['./src/test/setupTests.ts'],
      // e2e/ son specs de Playwright (otro test runner, otro `test`/`expect`), no de Vitest.
      exclude: [...configDefaults.exclude, 'e2e/**'],
    },
  };
});
