import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Primer paso hacia lint real (npm run lint solo comprobaba que esbuild pudiera empaquetar
// server.ts/main.tsx, no si el código tenía problemas). Deliberadamente en 'recommended', no
// 'strict'/'stylistic', y sin parserOptions.project (type-aware): el objetivo aquí es medir la
// deuda real primero, no bloquear builds con miles de avisos de golpe. Se corre como
// `npm run lint:eslint`, aparte del `lint` que ya usa CI, para no romperlo.
export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'build/**',
      'node_modules/**',
      'public/**',
      'coverage/**',
      'assets/.aistudio/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'warn',
    },
  },
  {
    files: ['server/**/*.ts', 'server.ts', 'api/**/*.ts', 'vite.config.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
    },
  },
  {
    // Los tests son el sitio establecido en el repo para castear/mockear con libertad
    // (ver server/__tests__/auth_bandas.test.ts) - no vale la pena que el lint discuta eso.
    files: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  }
);
