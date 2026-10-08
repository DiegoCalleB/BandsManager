# ADR 0013: Puerta local de calidad antes de cada push

- **Estado:** Aceptada
- **Fecha:** 2026-10-08
- **Origen:** nueva. Implementación: `scripts/check-all.mjs`, `.husky/pre-push`, `scripts/known-red.json`.

## Contexto

El CI vive en GitHub Actions (`.github/workflows/ci.yml`, `docs.yml`). El 2026-10-08 se comprobó que **ningún job se estaba ejecutando**: todos terminaban en 2–3 s con `runner_id: 0`, sin runner y sin pasos, y la anotación de GitHub decía *«The job was not started because recent account payments have failed or your spending limit needs to be increased»*. Pasaba en `main` (los últimos ocho runs de CI y Release), en las ramas y en los PRs. Nadie lo notó porque un check rojo se parece a un check rojo por una razón real.

Mientras tanto Railway sigue desplegando `main` por su propia integración con GitHub: el código llegaba a producción sin que se ejecutara un solo test. Ese riesgo ya existía; lo nuevo es que ahora se ha visto.

## Decisión

Una puerta de calidad que corre en la máquina de quien empuja, independiente de Actions:

1. **`npm run check:all`** reproduce los pasos del CI: `tsc --noEmit`, toda la suite de Vitest y `npm run verify:docs` (~1–2 min; typecheck y tests en paralelo). Con `--full` añade los guardarraíles de diseño, el build check y el ratchet de ESLint, leyendo los umbrales de `ci.yml` para no duplicar números que caducan.
2. **`.husky/pre-push`** lo ejecuta antes de cada `git push` y lo cancela si hay fallos nuevos. Se puede saltar con `git push --no-verify`.
3. **Fallos conocidos (`scripts/known-red.json`):** tests que ya fallaban antes, con motivo y fecha. Se siguen ejecutando y se muestran; solo dejan de bloquear. Es el mismo ratchet que el CI usa con `tsc` y ESLint: no se oculta la deuda, se impide que crezca. Hoy contiene una entrada (`schemaContract`).
4. **Reintento aislado:** un test que falla en la suite completa pero pasa al repetirlo solo se lista como «inestable» y no bloquea; uno que vuelve a fallar bloquea. Surgió de un caso real: `emailValidator` hace una consulta DNS real y falló una vez con `tsc` y la suite compitiendo por CPU, mientras pasaba 3 de 3 en aislado.

## Alternativas descartadas

- **Poner los tests en el build de Railway:** haría de puerta, pero alarga cada despliegue y ejecuta los tests en la infraestructura de producción. Se mantiene el `typecheck` que ya hace `npm run build`.
- **Saltar el test rojo de `main` en el hook:** desactivar un test para ponerlo en verde. Se prefiere listarlo con motivo y que siga ejecutándose.
- **Ejecutarlo en cada commit (`pre-commit`):** un minuto por commit frena la iteración; el push es el punto en que el código sale de la máquina.
- **Runner propio de Actions:** no se ha comprobado que un bloqueo de facturación no afecte también a los runners propios, y añade infraestructura que mantener.
- **Hacer público el repositorio para tener Actions gratis:** es una decisión de visibilidad con otras consecuencias, no un arreglo de tooling.
- **Solo arreglar la facturación:** necesario, pero no suficiente. Es lo que devuelve el CI; esta puerta es lo que evita volver a quedarse a ciegas.

## Consecuencias

- **Es una convención, no una garantía.** Nada en el servidor impide empujar con `--no-verify` ni mergear desde la interfaz de GitHub. Un CI funcionando sigue siendo preferible; esto es la red de seguridad.
- **Solo actúa donde estén instalados los hooks** (los instala `prepare` con husky). Un `npm ci --ignore-scripts` los omite.
- **Cada push cuesta 1–2 minutos.** Si duele, `--no-verify` en emergencias.
- **El reintento aislado puede ocultar un fallo intermitente real.** Se compensa listándolo siempre; los inestables son candidatos a mockear o a arreglar. Hoy el único conocido es el DNS real de `emailValidator`.
- **`known-red.json` debe vaciarse:** cuando el test pase, `check:all --strict` avisa de que la entrada ha caducado.
