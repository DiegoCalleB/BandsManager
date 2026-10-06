/**
 * Escáner estático del código del servidor: para cada cadena de supabase-js
 *   supabase.from('tabla').upsert|insert|update(payload) / .select('a,b') / .eq('col', …)
 * extrae qué columnas toca. Compara después con el esquema real (ver schemaContract.test.ts).
 *
 * Las claves de un payload no se leen del texto, sino del TIPO que el compilador infiere para
 * el argumento, así que valen objetos literales, variables y spreads. Si el tipo es `any` o un
 * índice abierto no hay claves que comprobar y se ignora (queda fuera, no falla).
 */
import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';

const RAIZ = path.resolve(__dirname, '../..');

export type TipoUso = 'escritura' | 'filtro' | 'seleccion' | 'orden';

export interface UsoColumna {
  tabla: string;
  columna: string;
  tipo: TipoUso;
  metodo: string;
  fichero: string;
  linea: number;
}

const METODOS_ESCRITURA = new Set(['upsert', 'insert', 'update']);
const METODOS_FILTRO = new Set(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in', 'contains', 'not']);

function ficherosServidor(): string[] {
  const salida: string[] = [];
  const visitar = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const ruta = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === '__tests__' || e.name === 'node_modules' || e.name === 'audit') continue;
        visitar(ruta);
      } else if (e.name.endsWith('.ts') && !e.name.endsWith('.test.ts') && !e.name.endsWith('.d.ts')) {
        salida.push(ruta);
      }
    }
  };
  visitar(path.join(RAIZ, 'server'));
  salida.push(path.join(RAIZ, 'server.ts'));
  return salida;
}

/** Sube por la cadena `a.b(...).c(...)` hasta encontrar `.from('tabla')` con literal. */
function tablaDeLaCadena(llamada: ts.CallExpression): string | null {
  let actual: ts.Expression = llamada;
  while (true) {
    if (ts.isCallExpression(actual)) {
      const callee = actual.expression;
      if (ts.isPropertyAccessExpression(callee)) {
        if (callee.name.text === 'from') {
          const arg = actual.arguments[0];
          return arg && (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) ? arg.text : null;
        }
        actual = callee.expression;
        continue;
      }
      return null;
    }
    if (ts.isPropertyAccessExpression(actual) || ts.isNonNullExpression(actual) || ts.isParenthesizedExpression(actual) || ts.isAwaitExpression(actual)) {
      actual = actual.expression;
      continue;
    }
    return null;
  }
}

function clavesDelTipo(checker: ts.TypeChecker, expr: ts.Expression): string[] {
  let tipo = checker.getTypeAtLocation(expr);
  // Arrays de filas: las claves son las del elemento.
  if (checker.isArrayType(tipo)) {
    const elemento = checker.getTypeArguments(tipo as ts.TypeReference)[0];
    if (elemento) tipo = elemento;
  }
  if (tipo.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) return [];
  const tipos = tipo.isUnion() ? tipo.types : [tipo];
  const claves = new Set<string>();
  for (const t of tipos) {
    if (t.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown | ts.TypeFlags.Null | ts.TypeFlags.Undefined)) continue;
    for (const p of checker.getPropertiesOfType(t)) claves.add(p.getName());
  }
  return [...claves];
}

/** Columnas de un `.select('a, b, rel(c)')`: solo las simples; `*` y relaciones se ignoran. */
function columnasDeSelect(texto: string): string[] {
  const sinRelaciones = texto.replace(/\([^)]*\)/g, '');
  return sinRelaciones
    .split(',')
    .map((c) => c.trim())
    .filter((c) => c && c !== '*' && /^[a-z_][a-z0-9_]*$/i.test(c));
}

export function escanearUsosDeColumnas(): UsoColumna[] {
  const configPath = path.join(RAIZ, 'tsconfig.json');
  const cfg = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(cfg.config, ts.sys, RAIZ);
  const ficheros = ficherosServidor();
  const programa = ts.createProgram(ficheros, { ...parsed.options, incremental: false, noEmit: true });
  const checker = programa.getTypeChecker();
  const usos: UsoColumna[] = [];

  for (const fichero of ficheros) {
    const sf = programa.getSourceFile(fichero);
    if (!sf) continue;
    const rel = path.relative(RAIZ, fichero);

    const anotar = (nodo: ts.Node, tabla: string, columna: string, tipo: TipoUso, metodo: string) => {
      const { line } = sf.getLineAndCharacterOfPosition(nodo.getStart());
      usos.push({ tabla, columna: columna.toLowerCase(), tipo, metodo, fichero: rel, linea: line + 1 });
    };

    const visitar = (nodo: ts.Node) => {
      if (ts.isCallExpression(nodo) && ts.isPropertyAccessExpression(nodo.expression)) {
        const metodo = nodo.expression.name.text;
        const esEscritura = METODOS_ESCRITURA.has(metodo);
        const esFiltro = METODOS_FILTRO.has(metodo);
        const esSelect = metodo === 'select';
        const esOrden = metodo === 'order';
        if (esEscritura || esFiltro || esSelect || esOrden) {
          const tabla = tablaDeLaCadena(nodo);
          const arg = nodo.arguments[0];
          if (tabla && arg) {
            if (esEscritura) {
              for (const c of clavesDelTipo(checker, arg)) anotar(nodo, tabla, c, 'escritura', metodo);
            } else if ((ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) && !esSelect) {
              if (/^[a-z_][a-z0-9_]*$/i.test(arg.text)) anotar(nodo, tabla, arg.text, esOrden ? 'orden' : 'filtro', metodo);
            } else if ((ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) && esSelect) {
              for (const c of columnasDeSelect(arg.text)) anotar(nodo, tabla, c, 'seleccion', metodo);
            }
          }
        }
      }
      ts.forEachChild(nodo, visitar);
    };
    visitar(sf);
  }
  return usos;
}
