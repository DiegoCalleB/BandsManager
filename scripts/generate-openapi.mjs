#!/usr/bin/env node
// Genera docs/api/openapi.json (y docs/api/index.html) por análisis ESTÁTICO del AST de Express.
//
// Qué documenta de TODAS las rutas: método, ruta completa (con los prefijos de montaje), parámetros
// de ruta, autenticación (requireAuth / requireLeader / requireCronOrAuth), limitadores de ritmo,
// handler y fichero:línea. Qué NO puede deducir: esquemas de petición/respuesta, porque el proyecto
// no usa ninguna librería de validación. Esos se aportan a mano en docs/api/overrides.json y las
// operaciones que los tienen quedan marcadas con `x-esquemas: curado`.
//
// Uso:  node scripts/generate-openapi.mjs           escribe docs/api/*
//       node scripts/generate-openapi.mjs --check   falla (exit 1) si lo escrito no coincide con el código
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

// TypeScript 6 no se resuelve con `import` ESM desde un .mjs; require sí funciona.
const ts = createRequire(import.meta.url)("typescript");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SALIDA_JSON = path.join(ROOT, "docs/api/openapi.json");
const SALIDA_HTML = path.join(ROOT, "docs/api/index.html");
const SALIDA_MD = path.join(ROOT, "docs/api/REFERENCIA.md");
const OVERRIDES = path.join(ROOT, "docs/api/overrides.json");
const MODO_CHECK = process.argv.includes("--check");

const METODOS = ["get", "post", "put", "patch", "delete"];
const AUTH_MW = new Set(["requireAuth", "requireLeader", "requireCronOrAuth"]);
const rel = (f) => path.relative(ROOT, f).split(path.sep).join("/");

// ── Utilidades de AST ───────────────────────────────────────────────────────────────────────────
const cacheFuentes = new Map();
function cargar(file) {
  if (!cacheFuentes.has(file)) {
    const texto = fs.readFileSync(file, "utf8");
    cacheFuentes.set(file, { texto, sf: ts.createSourceFile(file, texto, ts.ScriptTarget.Latest, true) });
  }
  return cacheFuentes.get(file);
}

function resolverImport(desde, especificador) {
  if (!especificador.startsWith(".")) return null;
  const base = path.resolve(path.dirname(desde), especificador.replace(/\.js$/, ""));
  for (const c of [base + ".ts", base + ".tsx", path.join(base, "index.ts")]) if (fs.existsSync(c)) return c;
  return null;
}

function importsDe(file) {
  const { sf } = cargar(file);
  const mapa = new Map();
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !ts.isStringLiteral(st.moduleSpecifier)) continue;
    const destino = resolverImport(file, st.moduleSpecifier.text);
    if (!destino) continue;
    const clausula = st.importClause;
    if (!clausula) continue;
    if (clausula.name) mapa.set(clausula.name.text, destino);
    if (clausula.namedBindings && ts.isNamedImports(clausula.namedBindings)) {
      for (const el of clausula.namedBindings.elements) mapa.set(el.name.text, destino);
    }
  }
  return mapa;
}

// Nombres de variables que son un Router (o `app`) en este fichero.
function receptoresDe(file) {
  const { sf } = cargar(file);
  const nombres = new Set();
  const visitar = (n) => {
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer && ts.isCallExpression(n.initializer)) {
      const t = n.initializer.expression.getText(sf);
      if (t === "express.Router" || t === "Router" || t === "express") nombres.add(n.name.text);
    }
    ts.forEachChild(n, visitar);
  };
  visitar(sf);
  return nombres;
}

function textoLiteral(nodo) {
  if (!nodo) return null;
  if (ts.isStringLiteral(nodo) || ts.isNoSubstitutionTemplateLiteral(nodo)) return nodo.text;
  return null;
}

// Comentarios contiguos justo encima de una sentencia (sin línea en blanco de por medio).
function comentarioEncima(file, sentencia) {
  const { texto } = cargar(file);
  const rangos = ts.getLeadingCommentRanges(texto, sentencia.getFullStart()) || [];
  const pegados = [];
  let limite = sentencia.getStart();
  for (let i = rangos.length - 1; i >= 0; i--) {
    const entre = texto.slice(rangos[i].end, limite);
    if ((entre.match(/\n/g) || []).length > 1) break;
    pegados.unshift(rangos[i]);
    limite = rangos[i].pos;
  }
  const limpio = pegados
    .map((r) => texto.slice(r.pos, r.end).replace(/^\/\*+|\*+\/$/g, "").split("\n")
      .map((l) => l.replace(/^\s*(\/\/|\*)\s?/, "").trim()).filter(Boolean).join(" "))
    .join(" ")
    .replace(/\s+/g, " ").trim();
  return limpio.length > 400 ? limpio.slice(0, 397) + "..." : limpio;
}

// Texto del handler: función en línea, o la declaración local si es un identificador.
function textoHandler(sf, handler) {
  if (!handler) return null;
  if (ts.isArrowFunction(handler) || ts.isFunctionExpression(handler)) return handler.getText(sf);
  if (ts.isIdentifier(handler)) {
    let hallado = null;
    const buscar = (n) => {
      if (hallado) return;
      if (ts.isFunctionDeclaration(n) && n.name?.text === handler.text) hallado = n.getText(sf);
      else if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.name.text === handler.text && n.initializer) hallado = n.initializer.getText(sf);
      else ts.forEachChild(n, buscar);
    };
    buscar(sf);
    return hallado;
  }
  return null; // método de un controlador importado: no se analiza
}

// Cómo se protege realmente un endpoint. No se adivina: se informa de lo que el código muestra.
function clasificarAutenticacion(intermedios, textoDelHandler) {
  if (intermedios.some((m) => AUTH_MW.has(m))) return { tipo: "middleware", marcas: [] };
  if (textoDelHandler === null) return { tipo: "desconocida", marcas: [] };
  const marcas = [];
  if (/getUserFromRequest\(/.test(textoDelHandler)) marcas.push("getUserFromRequest");
  if (/headers\.authorization|bakandeya_token|ACTIVE_SESSIONS\[/.test(textoDelHandler)) marcas.push("lee el token de sesión");
  if (/firmaCoincide|firmaDeFeed/.test(textoDelHandler)) marcas.push("firma HMAC en la URL");
  if (/stripe-signature|constructEvent\(/.test(textoDelHandler)) marcas.push("firma Stripe");
  if (/svix|webhook-signature|verifyWebhook/i.test(textoDelHandler)) marcas.push("firma webhook");
  if (/timingSafeEqual|CRON_SECRET|x-cron-secret/i.test(textoDelHandler)) marcas.push("secreto compartido");
  if (marcas.includes("getUserFromRequest") || marcas.includes("lee el token de sesión")) return { tipo: /status\(401\)/.test(textoDelHandler) ? "handler" : "handler-opcional", marcas };
  if (marcas.length) return { tipo: "firma", marcas };
  return { tipo: "ninguna", marcas };
}

function nombreDeArgumento(sf, arg) {
  if (ts.isIdentifier(arg)) return arg.text;
  if (ts.isPropertyAccessExpression(arg)) return arg.getText(sf);
  if (ts.isCallExpression(arg)) return arg.expression.getText(sf);
  return "(inline)";
}

// ── Recorrido de routers ────────────────────────────────────────────────────────────────────────
const operaciones = new Map(); // "GET /api/x" -> operación
const duplicadas = [];
const noResueltas = [];
const omitidas = [];

function unir(prefijo, ruta) {
  const j = ("/" + prefijo + "/" + ruta).replace(/\/+/g, "/");
  return j.length > 1 ? j.replace(/\/$/, "") : j;
}

function aOpenApi(ruta) {
  return ruta.replace(/:([A-Za-z0-9_]+)(\([^)]*\))?[?*+]?/g, "{$1}");
}

function procesarFichero(file, prefijo, dominio, pila) {
  const clave = file + "|" + prefijo;
  if (pila.has(clave)) return;
  pila = new Set(pila).add(clave);

  const { sf } = cargar(file);
  const imports = importsDe(file);
  const receptores = receptoresDe(file);

  const visitar = (n) => {
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression)) {
      const recep = n.expression.expression;
      const metodo = n.expression.name.text;
      if (ts.isIdentifier(recep) && receptores.has(recep.text)) {
        if (METODOS.includes(metodo)) registrarRuta(file, sf, n, metodo, prefijo, dominio);
        else if (metodo === "use") montar(file, sf, n, imports, prefijo, dominio, pila);
      }
    }
    ts.forEachChild(n, visitar);
  };
  visitar(sf);
}

function montar(file, sf, llamada, imports, prefijo, dominio, pila) {
  const args = llamada.arguments;
  let sub = "";
  const lit = textoLiteral(args[0]);
  if (lit !== null) sub = lit;
  for (const a of args) {
    if (ts.isIdentifier(a) && imports.has(a.text)) {
      const destino = imports.get(a.text);
      if (!rel(destino).startsWith("server/routes/")) continue;
      const dom = dominio ?? rel(destino).replace(/^server\/routes\//, "").split("/")[0].replace(/\.ts$/, "");
      procesarFichero(destino, unir(prefijo, sub), dom, pila);
    } else if (ts.isCallExpression(a) && /router/i.test(a.expression.getText(sf))) {
      noResueltas.push(`${rel(file)}:${sf.getLineAndCharacterOfPosition(a.getStart()).line + 1} montaje por llamada: ${a.getText(sf).slice(0, 60)}`);
    }
  }
}

function registrarRuta(file, sf, llamada, metodo, prefijo, dominio) {
  const args = [...llamada.arguments];
  const linea = sf.getLineAndCharacterOfPosition(llamada.getStart()).line + 1;
  let rutas = [];
  if (args[0] && ts.isArrayLiteralExpression(args[0])) rutas = args[0].elements.map(textoLiteral);
  else rutas = [textoLiteral(args[0])];
  if (rutas.some((r) => r === null)) {
    noResueltas.push(`${rel(file)}:${linea} ruta no literal: ${args[0]?.getText(sf).slice(0, 60)}`);
    rutas = rutas.filter((r) => r !== null);
  }

  const resto = args.slice(1);
  const handler = resto.length ? resto[resto.length - 1] : null;
  const intermedios = resto.slice(0, -1).map((a) => nombreDeArgumento(sf, a));
  const nombreHandler = handler ? nombreDeArgumento(sf, handler) : null;
  const sentencia = (function sube(n) { return n.parent && !ts.isExpressionStatement(n) ? sube(n.parent) : n; })(llamada);
  const comentario = ts.isExpressionStatement(sentencia) ? comentarioEncima(file, sentencia) : "";

  for (const r of rutas) {
    const completa = aOpenApi(unir(prefijo, r));
    const k = `${metodo.toUpperCase()} ${completa}`;
    const fuente = `${rel(file)}:${linea}`;
    if (operaciones.has(k)) { duplicadas.push(`${k} (${operaciones.get(k)["x-source"]} y ${fuente})`); continue; }
    if (completa === "/*" || completa === "*") { omitidas.push(`${k} (${fuente}): fallback de la SPA, no es API`); continue; }
    operaciones.set(k, { metodo, ruta: completa, dominio: dominio ?? "sistema", intermedios, nombreHandler, comentario, auth: clasificarAutenticacion(intermedios, textoHandler(sf, handler)), "x-source": fuente });
  }
}

// ── Montaje desde server.ts ─────────────────────────────────────────────────────────────────────
const SERVER = path.join(ROOT, "server.ts");
procesarFichero(SERVER, "", null, new Set());

// Las rutas declaradas directamente en server.ts no pasan por un router montado: dominio "sistema".
for (const op of operaciones.values()) if (op["x-source"].startsWith("server.ts:")) op.dominio = "sistema";

// ── Construcción del documento OpenAPI ──────────────────────────────────────────────────────────
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const overrides = fs.existsSync(OVERRIDES) ? JSON.parse(fs.readFileSync(OVERRIDES, "utf8")) : {};
const ordenMetodos = METODOS;

function fusionar(base, extra) {
  if (Array.isArray(extra) || typeof extra !== "object" || extra === null) return extra;
  const salida = { ...base };
  for (const [k, v] of Object.entries(extra)) salida[k] = k in base && typeof base[k] === "object" && !Array.isArray(base[k]) ? fusionar(base[k], v) : v;
  return salida;
}

const rutas = {};
const idsUsados = new Set();
const dominios = new Set();
let curadas = 0;

const claves = [...operaciones.keys()].sort((a, b) => {
  const [ma, ra] = a.split(" "), [mb, rb] = b.split(" ");
  return ra === rb ? ordenMetodos.indexOf(ma.toLowerCase()) - ordenMetodos.indexOf(mb.toLowerCase()) : ra < rb ? -1 : 1;
});

for (const k of claves) {
  const o = operaciones.get(k);
  dominios.add(o.dominio);
  const auth = o.intermedios.filter((m) => AUTH_MW.has(m));
  const limitadores = o.intermedios.filter((m) => /Limiter$/.test(m));

  let seguridad;
  if (auth.includes("requireCronOrAuth")) seguridad = [{ cronSecret: [] }, { bearerAuth: [] }, { cookieAuth: [] }, { authTokenHeader: [] }];
  else if (auth.length) seguridad = [{ bearerAuth: [] }, { cookieAuth: [] }, { authTokenHeader: [] }];
  else if (o.auth.tipo === "handler") seguridad = [{ bearerAuth: [] }, { cookieAuth: [] }, { authTokenHeader: [] }];
  else if (o.auth.tipo === "handler-opcional") seguridad = [{}, { bearerAuth: [] }, { cookieAuth: [] }, { authTokenHeader: [] }];
  else seguridad = [];

  let operationId = (o.metodo + o.ruta).replace(/[^A-Za-z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""));
  if (idsUsados.has(operationId)) operationId += "_" + idsUsados.size;
  idsUsados.add(operationId);

  const parametros = [...o.ruta.matchAll(/\{([^}]+)\}/g)].map((m) => ({ name: m[1], in: "path", required: true, schema: { type: "string" } }));
  if (auth.length || o.auth.tipo.startsWith("handler")) parametros.push({ $ref: "#/components/parameters/BandIdActiva" });

  const respuestas = { 200: { description: "Respuesta correcta." } };
  if (auth.length || o.auth.tipo === "handler") respuestas[401] = { $ref: "#/components/responses/NoAutenticado" };
  if (auth.includes("requireLeader")) respuestas[403] = { $ref: "#/components/responses/SoloLider" };
  if (limitadores.length) respuestas[429] = { $ref: "#/components/responses/DemasiadasPeticiones" };

  let op = {
    tags: [o.dominio],
    operationId,
    ...(o.comentario ? { description: `Comentario en el código: ${o.comentario}` } : {}),
    parameters: parametros,
    security: seguridad,
    responses: respuestas,
    "x-source": o["x-source"],
    ...(o["x-sombreada-por"] ? { "x-sombreada-por": o["x-sombreada-por"] } : {}),
    ...(o.nombreHandler && o.nombreHandler !== "(inline)" ? { "x-handler": o.nombreHandler } : {}),
    "x-autenticacion": o.auth.tipo,
    ...(o.auth.marcas.length ? { "x-comprobaciones-handler": o.auth.marcas } : {}),
    ...(limitadores.length ? { "x-rate-limiters": limitadores } : {}),
    ...(auth.includes("requireLeader") ? { "x-requires-leader": true } : {}),
  };
  if (!op.parameters.length) delete op.parameters;

  const extra = overrides.operations?.[k];
  if (extra) {
    const parametrosAuto = op.parameters || [];
    op = fusionar(op, extra);
    if (extra.parameters) op.parameters = [...parametrosAuto, ...extra.parameters];
    if (extra.requestBody || Object.keys(extra.responses || {}).some((c) => c.startsWith("2"))) { op["x-esquemas"] = "curado"; curadas++; }
  }
  (rutas[o.ruta] ??= {})[o.metodo] = op;
}

for (const k of Object.keys(overrides.operations || {})) {
  if (!operaciones.has(k)) { console.error(`[openapi] overrides.json: la operación «${k}» ya no existe en el código.`); process.exit(1); }
}

// Rutas sombreadas: Express resuelve por orden de declaración. Si una ruta con parámetro (`/x/{id}`)
// se registra ANTES que una fija (`/x/bulk`) con el mismo método, la fija no se alcanza (salvo que la
// primera llame a next()). Lo marcamos como «posiblemente inalcanzable»; no se afirma que sea un bug.
const sombreadas = [];
{
  const lista = [...operaciones.entries()];
  const aRegex = (p) => new RegExp("^" + p.replace(/[.*+?^$()|[\]\\]/g, "\\const total = operaciones.size;").replace(/\{[^}]+\}/g, "[^/]+") + "$");
  for (let i = 0; i < lista.length; i++) {
    const [kB, b] = lista[i];
    for (let j = 0; j < i; j++) {
      const [kA, a2] = lista[j];
      if (a2.metodo !== b.metodo || a2.ruta === b.ruta || !a2.ruta.includes("{")) continue;
      if (aRegex(a2.ruta).test(b.ruta)) { b["x-sombreada-por"] = kA; sombreadas.push(`${kB} (${b["x-source"]}) queda detrás de ${kA} (${a2["x-source"]})`); break; }
    }
  }
}
const total = operaciones.size;
const declaraciones = new Set([...operaciones.values()].map((o) => o["x-source"])).size;
const documento = {
  openapi: "3.1.0",
  info: {
    title: "BandManager.io API",
    version: pkg.version,
    description:
      "Referencia de la API interna de BandManager.io. **Generada automáticamente** por análisis estático (`scripts/generate-openapi.mjs`); no se edita a mano.\n\n" +
      `Todas las operaciones (${total}) documentan método, ruta completa, autenticación, limitadores de ritmo, handler y fichero:línea. ` +
      `Los esquemas de petición y respuesta solo están descritos en las ${curadas} operaciones marcadas con \`x-esquemas: curado\` (fuente: \`docs/api/overrides.json\`): ` +
      "el proyecto no usa una librería de validación de la que derivarlos.\n\n" +
      "Las operaciones con `security: []` son públicas. La banda activa se indica con la cabecera `x-band-id` y el servidor la valida contra las bandas del usuario (ADR 0004).",
    license: { name: "AGPL-3.0-only", identifier: "AGPL-3.0-only" },
  },
  servers: [{ url: "/" }],
  tags: [...dominios].sort().map((name) => ({ name, ...(overrides.tags?.[name] ? { description: overrides.tags[name] } : {}) })),
  paths: rutas,
  components: fusionar({
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", description: "Token de sesión en `Authorization: Bearer <token>`. Las sesiones duran 30 días." },
      cookieAuth: { type: "apiKey", in: "cookie", name: "bakandeya_token", description: "Mismo token de sesión, en cookie." },
      authTokenHeader: { type: "apiKey", in: "header", name: "x-auth-token", description: "Mismo token de sesión, en cabecera." },
      cronSecret: { type: "apiKey", in: "header", name: "x-cron-secret", description: "Secreto compartido (`CRON_SECRET`) para tareas programadas." },
    },
    parameters: {
      BandIdActiva: {
        name: "x-band-id", in: "header", required: false, schema: { type: "string" },
        description: "Banda sobre la que operar. Solo se acepta si el usuario pertenece a ella; si no, se usa su banda activa (`getTargetBandId`, ADR 0004).",
      },
    },
    responses: {
      NoAutenticado: { description: "Sin sesión válida.", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
      SoloLider: { description: "Requiere rol de líder de la banda.", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
      DemasiadasPeticiones: { description: "Se superó el límite de ritmo de este endpoint.", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
    },
    schemas: { Error: { type: "object", properties: { error: { type: "string" } }, required: ["error"] } },
  }, overrides.components || {}),
};

const json = JSON.stringify(documento, null, 2) + "\n";

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>BandManager.io API</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui.css" integrity="sha384-wxLW6kwyHktdDGr6Pv1zgm/VGJh99lfUbzSn6HNHBENZlCN7W602k9VkGdxuFvPn" crossorigin="anonymous">
<style>body{margin:0;background:#fff}</style>
</head>
<body>
<div id="ui"></div>
<script id="spec" type="application/json">${json.replace(/</g, "\\u003c")}</script>
<script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui-bundle.js" integrity="sha384-wmyclcVGX/WhUkdkATwhaK1X1JtiNrr2EoYJ+diV3vj4v6OC5yCeSu+yW13SYJep" crossorigin="anonymous"></script>
<script>
  window.ui = SwaggerUIBundle({
    spec: JSON.parse(document.getElementById("spec").textContent),
    dom_id: "#ui",
    deepLinking: true,
    docExpansion: "none",
    tagsSorter: "alpha",
  });
</script>
</body>
</html>
`;


// ── Referencia en Markdown (se lee directamente en GitHub, sin visor) ───────────────────────────
const ETIQUETA_ACCESO = {
  middleware: "Sesión",
  handler: "Sesión (comprobada en el handler)",
  "handler-opcional": "Sesión opcional",
  firma: "Firma o secreto",
  ninguna: "Pública",
  desconocida: "No determinado",
};
const celda = (t) => String(t ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
const enlaceFuente = (x) => { const [fichero, linea] = x.split(":"); return `[\`${x}\`](../../${fichero}#L${linea})`; };
const accesoDe = (op) => ETIQUETA_ACCESO[op["x-autenticacion"]] + (op["x-requires-leader"] ? " + líder" : "");
const filaDe = (metodo, ruta, op) =>
  `| \`${metodo.toUpperCase()}\` | \`${celda(ruta)}\` | ${accesoDe(op)} | ${(op["x-rate-limiters"] || []).join(", ") || "—"} | ${op["x-esquemas"] === "curado" ? "★" : ""} | ${enlaceFuente(op["x-source"])} |`;
const CABECERA = "| Método | Ruta | Acceso | Límite de ritmo | Esquema | Código |\n|---|---|---|---|---|---|";

const porDominio = new Map();
const sinSesion = [];
for (const [ruta, metodos] of Object.entries(rutas)) {
  for (const [metodo, op] of Object.entries(metodos)) {
    const dom = op.tags[0];
    if (!porDominio.has(dom)) porDominio.set(dom, []);
    porDominio.get(dom).push(filaDe(metodo, ruta, op));
    if (op["x-autenticacion"] !== "middleware") sinSesion.push({ metodo, ruta, op });
  }
}
const cuentaAcceso = {};
for (const o of operaciones.values()) cuentaAcceso[o.auth.tipo] = (cuentaAcceso[o.auth.tipo] || 0) + 1;

const referenciaMd = [
  "# Referencia de la API",
  "",
  "> Generado automáticamente por `scripts/generate-openapi.mjs` a partir del código. No se edita a mano: ejecuta `npm run docs:api`.",
  "",
  `**${total} rutas HTTP** (${declaraciones} declaraciones de handler; el resto son alias) en ${dominios.size} dominios. Contrato máquina-legible: [\`openapi.json\`](./openapi.json) (OpenAPI 3.1). Visor interactivo: [\`index.html\`](./index.html) (hay que abrirlo en un navegador; GitHub no lo renderiza). Decisión de diseño: [ADR 0012](../adr/0012-contrato-api-openapi-por-ast.md).`,
  "",
  "## Cómo leerla",
  "",
  "- **Acceso** es lo que el código muestra, no lo que se supone. Una ruta \"Pública\" es una ruta sin ninguna comprobación detectada; puede ser intencionada (login, páginas públicas) y conviene revisarla.",
  "- **Esquema ★** significa que la petición y la respuesta están descritas a mano en [`overrides.json`](./overrides.json). El resto solo documenta la superficie (método, ruta, acceso, límites, código): el proyecto no usa una librería de validación de la que derivar esquemas.",
  "- La banda activa se envía en la cabecera `x-band-id` y el servidor la valida contra las bandas del usuario ([ADR 0004](../adr/0004-band-id-resuelto-en-servidor.md)).",
  "",
  "| Acceso | Rutas |",
  "|---|---|",
  ...Object.entries(ETIQUETA_ACCESO).filter(([k]) => cuentaAcceso[k]).map(([k, v]) => `| ${v} | ${cuentaAcceso[k]} |`),
  "",
  "## Rutas sin sesión de middleware",
  "",
  "Son las que un revisor de seguridad querrá mirar primero.",
  "",
  CABECERA,
  ...sinSesion.map(({ metodo, ruta, op }) => filaDe(metodo, ruta, op)),
  "",
  "## Operaciones con esquema documentado",
  "",
  ...Object.entries(overrides.operations || {}).map(([k, v]) => `- \`${k}\`: ${v.summary || ""}`),
  "",
  "## Todas las rutas por dominio",
  "",
  ...[...porDominio.keys()].sort().flatMap((dom) => [`### ${dom}`, ...(overrides.tags?.[dom] ? ["", overrides.tags[dom]] : []), "", CABECERA, ...porDominio.get(dom), ""]),
  "## Avisos del análisis estático",
  "",
  ...(duplicadas.length ? ["Declaradas dos veces (Express usa la primera; la segunda es código muerto):", "", ...duplicadas.map((d) => `- ${d}`), ""] : ["- Sin rutas declaradas dos veces.", ""]),
  ...(sombreadas.length ? ["Posiblemente inalcanzables (sombreadas por una ruta con parámetro declarada antes):", "", ...sombreadas.map((d) => `- ${d}`), ""] : ["- Sin rutas sombreadas.", ""]),
  ...(noResueltas.length ? ["No resueltas por el análisis:", "", ...noResueltas.map((d) => `- ${d}`), ""] : []),
  ...(omitidas.length ? ["Omitidas a propósito:", "", ...omitidas.map((d) => `- ${d}`), ""] : []),
].join("\n") + "\n";

// ── Informe y escritura ─────────────────────────────────────────────────────────────────────────
const porAuth = {};
for (const o of operaciones.values()) porAuth[o.auth.tipo] = (porAuth[o.auth.tipo] || 0) + 1;
console.log(`[openapi] ${total} operaciones HTTP (${declaraciones} declaraciones de handler) · ${curadas} con esquemas curados · ${dominios.size} dominios`);
console.log(`[openapi] autenticación: ${JSON.stringify(porAuth)}`);
if (sombreadas.length) console.warn(`[openapi] ${sombreadas.length} rutas posiblemente inalcanzables (sombreadas por una ruta con parámetro declarada antes):\n  - ${sombreadas.join("\n  - ")}`);
if (omitidas.length) console.log(`[openapi] omitidas: ${omitidas.join("; ")}`);
if (duplicadas.length) console.warn(`[openapi] ${duplicadas.length} declaraciones duplicadas (se conserva la primera):\n  - ${duplicadas.join("\n  - ")}`);
if (noResueltas.length) console.warn(`[openapi] ${noResueltas.length} casos no resueltos:\n  - ${noResueltas.join("\n  - ")}`);

if (MODO_CHECK) {
  const igual = (f, v) => fs.existsSync(f) && fs.readFileSync(f, "utf8") === v;
  if (!igual(SALIDA_JSON, json) || !igual(SALIDA_HTML, html) || !igual(SALIDA_MD, referenciaMd)) {
    console.error("[openapi] docs/api no coincide con el código. Ejecuta: node scripts/generate-openapi.mjs");
    process.exit(1);
  }
  console.log("[openapi] OK - docs/api coincide con el código.");
} else {
  fs.mkdirSync(path.dirname(SALIDA_JSON), { recursive: true });
  fs.writeFileSync(SALIDA_JSON, json);
  fs.writeFileSync(SALIDA_HTML, html);
  fs.writeFileSync(SALIDA_MD, referenciaMd);
  console.log(`[openapi] escrito ${rel(SALIDA_JSON)}, ${rel(SALIDA_HTML)} y ${rel(SALIDA_MD)}`);
}
