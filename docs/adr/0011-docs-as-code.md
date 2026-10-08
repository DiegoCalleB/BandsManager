# ADR 0011: Documentación como código, verificada en CI

- **Estado:** Aceptada
- **Fecha:** 2026-10-08
- **Origen:** nueva.

## Contexto

La documentación se desincronizaba del código sin que nadie lo notara. Al revisarla se encontraron: cifras del README que no coincidían con el repo (284 endpoints, no 283; 2.079 tests, no «más de 1.400»; 57 tablas en producción, no 47), cuatro enlaces rotos en el grafo, una frecuencia de scheduler documentada de forma incorrecta, y un workflow que nunca verificaba los cambios de solo `.md`.

## Decisión

La documentación se trata como código:

1. **Cifras comprobables:** `scripts/verify-docs-consistencia.cjs` cuenta endpoints, tests, migraciones y componentes y compara con el README. Falla si no coinciden.
2. **Enlaces comprobables:** el mismo script falla si un `[[enlace]]` del grafo apunta a una nota inexistente.
3. **Referencias comprobables:** `scripts/verify-docs-refs.cjs` ya comprobaba rutas en AGENTS.md y en las skills.
4. **Generadores validados:** `generate_obsidian_graph.ts` falla si un nodo enlaza a otro que no existe.
5. **Workflow propio:** `.github/workflows/docs.yml` corre con los cambios de `.md`, que `ci.yml` ignora. Además comprueba que el grafo regenerado coincide con el commiteado.

## Alternativas descartadas

- **Generar toda la documentación automáticamente (TypeDoc, OpenAPI):** útil para la API, pero no sustituye a las explicaciones de decisión. Queda como paso siguiente.
- **Revisión manual en cada PR:** ya falló; las cifras acumulaban deriva.

## Consecuencias

- Las cifras del README deben actualizarse cuando cambie el código. El script dice cuál es el valor real.
- El script no verifica que el contenido sea correcto, solo que coincida con el recuento. Un ADR mal razonado pasa.
- Pendiente: contrato de API (OpenAPI) generado desde las rutas.
