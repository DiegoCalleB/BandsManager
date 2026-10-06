import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {configDefaults} from 'vitest/config';
import fs from 'fs';

const { version } = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf8'));

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
      exclude: [...configDefaults.exclude, 'e2e/**'],
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
  };
});
