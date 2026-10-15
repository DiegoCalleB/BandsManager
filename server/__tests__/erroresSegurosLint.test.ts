/**
 * La regla «no devolver err.message en un 5xx» (eslint.config.js) rige sin excepciones: la lista de
 * ficheros con deuda se vació en octubre de 2026. Estas pruebas leen la configuración real y comprueban
 * que la regla detecta lo que debe y que nadie vuelve a abrir una excepción.
 */
import { describe, expect, it } from 'vitest';
import { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import config from '../../eslint.config.js';

type Entrada = { files?: string[]; ignores?: string[]; rules?: Record<string, unknown> };
const entradas = config as unknown as Entrada[];
const reglaActiva = entradas.find((e) => Array.isArray(e.rules?.['no-restricted-syntax']));
const reglaApagada = entradas.find((e) => e.rules?.['no-restricted-syntax'] === 'off');

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
  it('existe la regla y no hay ningún fichero exceptuado', () => {
    expect(reglaActiva).toBeTruthy();
    expect(reglaApagada, 'Una entrada que apaga no-restricted-syntax reabre la fuga de err.message: arregla el fichero en su lugar').toBeUndefined();
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
});
