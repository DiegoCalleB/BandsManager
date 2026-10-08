# ADR 0011: Documentación como código, verificada en CI

- **Estado:** Aceptada
- **Fecha:** 2026-10-08
- **Origen:** nueva.

## Contexto

La documentación se desincronizaba del código sin que nadie lo notara. Al revisarla se encontraron: cifras del README que no coincidían con el repo (el README decía 283 endpoints; un recuento por regex dio 284 y resultó ser incompleto, porque hay routers con otro nombre y rutas con alias: el análisis del AST da 352 rutas HTTP en 301 declaraciones. Además, 2.079 tests y no «más de 1.400», y 57 tablas en producción y no 47), cuatro enlaces rotos en el grafo, una frecuencia de scheduler documentada de forma incorrecta, y un workflow que nunca verificaba los cambios de solo `.md`.

## Decisión

La documentación se trata como código:

1. **Cifras comprobables:** `scripts/verify-docs-consistencia.cjs` cuenta endpoints, tests, migraciones y componentes y compara con el README. Falla si no coinciden.
2. **Enlaces comprobables:** el mismo script falla si un `[[enlace]]` del grafo apunta a una nota inexistente, o si un enlace relativo entre ficheros Markdown (README y `docs/`) apunta a un fichero que no existe. Al activarlo salieron tres enlaces rotos a un skill que no está donde `CLAUDE.md` dice.
3. **Referencias comprobables:** `scripts/verify-docs-refs.cjs` ya comprobaba rutas en AGENTS.md y en las skills.
4. **Generadores validados:** `generate_obsidian_graph.ts` falla si un nodo enlaza a otro que no existe.
5. **Contrato de API generado:** `scripts/generate-openapi.mjs` analiza el AST y escribe `docs/api/openapi.json` ([ADR 0012](./0012-contrato-api-openapi-por-ast.md)). El README toma de ahí su cifra de rutas.
6. **Skills sincronizados:** `scripts/sync-skills.mjs --check` falla si las copias por herramienta (`.claude/`, `.gemini/`, `.opencode/`) difieren de `skills/`. Antes era una copia manual y se desvió: la fuente conservaba una versión retirada de `fullstack-ux-design`, `visual-identity` solo existía en una copia y `.claude/skills/` no existía.
7. **Workflow propio:** `.github/workflows/docs.yml` corre con los cambios de `.md`, que `ci.yml` ignora. Además comprueba que el grafo regenerado coincide con el commiteado.

## Alternativas descartadas

- **Generar toda la documentación automáticamente (TypeDoc, OpenAPI):** útil para la API, pero no sustituye a las explicaciones de decisión. Queda como paso siguiente.
- **Revisión manual en cada PR:** ya falló; las cifras acumulaban deriva.

## Consecuencias

- **Rigor proporcionado al ritmo del repo.** Se mergean varios PRs al día. Por eso las cifras del README admiten una tolerancia (`max(3, 3 %)`, con `npm run docs:metricas` para reescribirlas) y el contrato de API ignora los cambios de número de línea: solo exige regenerarlo cuando cambia una ruta, su autenticación o sus límites. La primera versión era exacta y habría puesto el CI en rojo en casi cualquier PR de backend; se detectó al fusionar `main` y comprobar el resultado.

- Las cifras del README deben actualizarse cuando cambie el código. El script dice cuál es el valor real.
- El script no verifica que el contenido sea correcto, solo que coincida con el recuento. Un ADR mal razonado pasa.
