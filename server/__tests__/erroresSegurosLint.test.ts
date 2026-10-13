/**
 * La regla «no devolver err.message en un 5xx» (eslint.config.js) vive con una lista de ficheros
 * con deuda que solo puede encoger. Estas pruebas leen la configuración real y comprueban dos cosas:
 * que la regla detecta lo que debe y que la lista de deuda no conserva ficheros ya limpios.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import config from '../../eslint.config.js';

type Entrada = { files?: string[]; ignores?: string[]; rules?: Record<string, unknown> };
const entradas = config as unknown as Entrada[];
const reglaActiva = entradas.find((e) => Array.isArray(e.rules?.['no-restricted-syntax']));
const reglaApagada = entradas.find((e) => e.rules?.['no-restricted-syntax'] === 'off');
const deuda = reglaApagada?.files ?? [];

function infracciones(codigo: string, fichero = 'server/routes/ejemplo.ts') {
  const linter = new Linter({ configType: 'flat' });
  const mensajes = linter.verify(
    codigo,
    [{ files: ['**/*.ts'], languageOptions: { parser: tseslint.parser }, rules: { 'no-restricted-syntax': reglaActiva!.rules!['no-restricted-syntax'] as never } }],
    { filename: fichero },
  );
  return mensajes.filter((m) => m.ruleId === 'no-restricted-syntax');
}

describe('regla de errores seguros', () => {
  it('existe la regla y la lista de deuda', () => {
    expect(reglaActiva).toBeTruthy();
    expect(deuda.length).toBeGreaterThan(0);
  });

  it('detecta err.message en respuestas 5xx, con o sin return, con ? y en plantillas', () => {
    expect(infracciones('res.status(500).json({ error: err.message });')).toHaveLength(1);
    expect(infracciones('return res.status(503).json({ success: false, error: err?.message || "x" });')).toHaveLength(1);
    expect(infracciones('res.status(500).send(`Fallo: ${err.message}`);')).toHaveLength(1);
  });

  it('no molesta con respuestas 4xx, mensajes propios ni el responderError', () => {
    expect(infracciones('res.status(400).json({ error: err.message });')).toHaveLength(0);
    expect(infracciones('res.status(500).json({ error: "Error interno" });')).toHaveLength(0);
    expect(infracciones('responderError(res, err, "Error al guardar");')).toHaveLength(0);
    expect(infracciones('console.error(err.message);')).toHaveLength(0);
  });

  it('cada fichero de la lista de deuda sigue teniendo la infracción (si no, hay que quitarlo)', () => {
    const limpios = deuda.filter((f) => infracciones(fs.readFileSync(path.resolve(process.cwd(), f), 'utf8'), f).length === 0);
    expect(limpios, `Ya no tienen la infracción, quítalos de la lista de eslint.config.js: ${limpios.join(', ')}`).toEqual([]);
  });

  it('los ficheros de la lista existen', () => {
    const faltan = deuda.filter((f) => !fs.existsSync(path.resolve(process.cwd(), f)));
    expect(faltan).toEqual([]);
  });
});
