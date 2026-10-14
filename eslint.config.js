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
    rules: {
      // Convenciones habituales: `_` marca a propósito un parámetro o variable sin usar (el cuarto
      // argumento de un manejador de errores de Express, un hueco en una desestructuración), y una
      // clave sacada junto a `...resto` sirve precisamente para excluirla: así se quitan
      // `passwordHash` y `salt` del usuario que se devuelve al cliente.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
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
    // La presentación (presentacion/) es una página estática que corre en el navegador.
    files: ['presentacion/**/*.js'],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
  },
  {
    // Los scripts de utilidad (CommonJS y ESM) corren en Node: sin esto, cada require/process/console
    // salía como no-undef y los scripts nuevos gastaban margen del ratchet de CI sin ser un problema real.
    files: ['scripts/**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    // Los tests son el sitio establecido en el repo para castear/mockear con libertad
    // (ver server/__tests__/auth_bandas.test.ts) - no vale la pena que el lint discuta eso.
    files: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    // Errores seguros (docs/plan/PLAN_MEJORA.md, Fase 1.2): una respuesta 5xx no devuelve `err.message`,
    // que filtra al cliente errores internos de Postgres, Stripe o del disco. Se usa
    // `responderError(res, err, 'texto genérico')` (server/utils/errorHttp.ts), que da un mensaje
    // genérico y un `idError` para localizar el detalle en el log y en Sentry; los errores esperados
    // se lanzan como `ErrorHttp`.
    files: ['server/**/*.ts', 'server.ts'],
    ignores: ['**/__tests__/**', '**/*.test.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.property.name=/^(json|send)$/][callee.object.callee.property.name='status'][callee.object.arguments.0.value>=500] MemberExpression[property.name='message']",
          message:
            'No devuelvas err.message en una respuesta 5xx: usa responderError(res, err, "texto genérico") (server/utils/errorHttp.ts).',
        },
      ],
    },
  }
);
