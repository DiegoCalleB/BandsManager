/**
 * Generator of Obsidian-Compatible Architecture & Dependency Graph
 * Generates an interactive Markdown Knowledge Graph with Bidirectional Wikilinks ([[Node]])
 * Compatible with Obsidian Graph View, Foam, and Agentic Navigation.
 */

import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

interface GraphNode {
  id: string;
  title: string;
  layer: 'frontend' | 'hook' | 'route' | 'service' | 'db' | 'schema' | 'security' | 'agent';
  domain: 'booking' | 'repertoire' | 'finances' | 'epk' | 'auth' | 'system' | 'social';
  file: string;
  description: string;
  linksTo: string[];
  tags: string[];
  /** Tests que importan este fichero (solo informativo; los tests no son nodos). */
  tests?: string[];
  /** Solo nodos de tabla: columnas y ficheros SQL donde se define. */
  columnas?: string[];
  definidaEn?: string[];
}

const NODES: GraphNode[] = [
  // UI Layer
  {
    id: 'ui_booking_crm',
    title: 'Booking CRM Component',
    layer: 'frontend',
    domain: 'booking',
    file: 'src/components/BookingCRM.tsx',
    description: 'Panel principal del embudo de contratación, gestión de salas y radar comercial.',
    linksTo: ['hook_booking_pipeline', 'ui_leads_table', 'ui_venue_detail'],
    tags: ['ui', 'booking', 'crm']
  },
  {
    id: 'ui_leads_table',
    title: 'Leads Table & Actions',
    layer: 'frontend',
    domain: 'booking',
    file: 'src/components/booking/LeadsTable.tsx',
    description: 'Tabla interactiva de salas con estados CRM y acciones masivas.',
    linksTo: ['hook_booking_pipeline', 'sec_trust_boundary'],
    tags: ['ui', 'booking', 'table']
  },
  {
    id: 'ui_venue_detail',
    title: 'Venue Detail & Pitch Simulator',
    layer: 'frontend',
    domain: 'booking',
    file: 'src/components/booking/VenueDetailPanel.tsx',
    description: 'Ficha técnica de la sala, hilo de conversación y generador de respuestas.',
    linksTo: ['route_leads_pitch', 'route_leads_reply', 'agent_redactor'],
    tags: ['ui', 'booking', 'pitch']
  },
  {
    id: 'ui_repertoire_setlists',
    title: 'Repertorio & Setlists',
    layer: 'frontend',
    domain: 'repertoire',
    file: 'src/components/RepertorioSetlists.tsx',
    description: 'Gestión de canciones, directos, compatibilidad tonal y transiciones armónicas.',
    linksTo: ['route_repertoire', 'db_repertoire'],
    tags: ['ui', 'repertoire', 'audio']
  },

  // Hooks Layer
  {
    id: 'hook_booking_pipeline',
    title: 'useBookingPipeline Hook',
    layer: 'hook',
    domain: 'booking',
    file: 'src/hooks/useBookingPipeline.ts',
    description: 'Gestión del estado reactivo del pipeline de salas, filtros y transiciones de estado.',
    linksTo: ['route_leads_crud', 'sec_trust_boundary'],
    tags: ['hook', 'state', 'booking']
  },
  {
    id: 'hook_app_data',
    title: 'useAppData Hook',
    layer: 'hook',
    domain: 'system',
    file: 'src/hooks/useAppData.ts',
    description: 'Carga y sincronización global de datos de la banda autenticada.',
    linksTo: ['sec_trust_boundary', 'db_state_sync'],
    tags: ['hook', 'state', 'sync']
  },

  // Security Layer
  {
    id: 'sec_trust_boundary',
    title: 'Trust Boundary & Band Scoping',
    layer: 'security',
    domain: 'auth',
    file: 'server/utils/bandAccess.ts',
    description: 'Resolución forzosa del band_id desde la sesión autenticada. Bloquea inyecciones en req.body.',
    linksTo: ['db_leads', 'db_repertoire', 'db_payments', 'sec_ssrf_guard'],
    tags: ['security', 'trust-boundary', 'multi-tenancy']
  },
  {
    id: 'sec_ssrf_guard',
    title: 'SSRF URL Validator',
    layer: 'security',
    domain: 'system',
    file: 'server/utils/ssrfGuard.ts',
    description: 'Valida llamadas salientes fetch() bloqueando IPs privadas, loopback y metadatos cloud.',
    linksTo: ['agent_scout', 'route_leads_enrichment'],
    tags: ['security', 'ssrf', 'network']
  },
  {
    id: 'sec_prompt_safety',
    title: 'Prompt Injection Sanitizer',
    layer: 'security',
    domain: 'system',
    file: 'server/utils/promptSafety.ts',
    description: 'Sanitiza datos externos de salas y correos entrantes antes de inyectarlos en prompts de IA.',
    linksTo: ['agent_redactor', 'agent_lector', 'service_pitch_engine'],
    tags: ['security', 'owasp-llm', 'prompt-safety']
  },

  // API Routes Layer
  {
    id: 'route_leads_crud',
    title: 'Leads CRUD Route',
    layer: 'route',
    domain: 'booking',
    file: 'server/routes/leads/crud.ts',
    description: 'Endpoints REST para creación, actualización y filtrado de salas por banda.',
    linksTo: ['sec_trust_boundary', 'db_leads'],
    tags: ['api', 'route', 'leads']
  },
  {
    id: 'route_leads_pitch',
    title: 'Leads Pitch Generation Route',
    layer: 'route',
    domain: 'booking',
    file: 'server/routes/leads/pitch.ts',
    description: 'Endpoint para generación de pitches con IA y validación de Rate Limiting.',
    linksTo: ['sec_prompt_safety', 'service_pitch_engine', 'db_ai_ledger'],
    tags: ['api', 'route', 'pitch', 'ai']
  },
  {
    id: 'route_leads_reply',
    title: 'Leads Reply Route',
    layer: 'route',
    domain: 'booking',
    file: 'server/routes/leads/reply.ts',
    description: 'Endpoint para redacción automática de respuestas en hilos de negociación.',
    linksTo: ['sec_prompt_safety', 'service_pitch_engine', 'db_lead_messages'],
    tags: ['api', 'route', 'reply', 'ai']
  },
  {
    id: 'route_repertoire',
    title: 'Repertoire & Setlists Route',
    layer: 'route',
    domain: 'repertoire',
    file: 'server/routes/repertorio.ts',
    description: 'Endpoints para canciones, compatibilidad armónica y exportación a setlist.',
    linksTo: ['sec_trust_boundary', 'db_repertoire'],
    tags: ['api', 'route', 'repertoire']
  },

  // Agents & Services Layer
  {
    id: 'agent_scheduler',
    title: 'Agent Scheduler In-Process',
    layer: 'agent',
    domain: 'booking',
    file: 'server/services/agentScheduler.ts',
    description: 'Bucle in-process (tick de 24 h por defecto, AGENT_SCHEDULER_INTERVAL_MS) que orquesta el Scout, Enviador y Lector.',
    linksTo: ['agent_enviador', 'agent_lector', 'db_agent_schedule'],
    tags: ['agent', 'scheduler', 'cron']
  },
  {
    id: 'agent_enviador',
    title: 'Enviador Agent (Dispatcher)',
    layer: 'agent',
    domain: 'booking',
    file: 'server/services/agentEngine.ts',
    description: 'Despacha correos únicamente tras aprobación humana (aprobado_propuesta/respuesta).',
    linksTo: ['db_lead_messages', 'db_leads', 'sec_trust_boundary'],
    tags: ['agent', 'dispatcher', 'human-in-the-loop']
  },
  {
    id: 'agent_lector',
    title: 'Lector Agent (Listener)',
    layer: 'agent',
    domain: 'booking',
    file: 'server/services/lectorAgent.ts',
    description: 'Monitoriza respuestas entrantes de salas vía Gmail OAuth2 / IMAP según el scheduler (ver ADR 0007).',
    linksTo: ['sec_prompt_safety', 'db_lead_messages', 'db_leads'],
    tags: ['agent', 'listener', 'gmail-oauth']
  },
  {
    id: 'agent_scout',
    title: 'Scout Discovery Agent',
    layer: 'agent',
    domain: 'booking',
    file: 'server/auto_enrichment.ts',
    description: 'Descubre y enriquece información de salas registrándolas en estado nuevo.',
    linksTo: ['sec_ssrf_guard', 'db_leads'],
    tags: ['agent', 'scout', 'enrichment']
  },
  {
    id: 'service_pitch_engine',
    title: 'Pitch Engine & Multi-Model Routing',
    layer: 'service',
    domain: 'booking',
    file: 'server/services/pitchEngine.ts',
    description: 'Motor de IA generativa con fallback automático Gemini ➔ DeepSeek ➔ OpenAI.',
    linksTo: ['db_ai_ledger', 'sec_prompt_safety'],
    tags: ['service', 'ai', 'multi-model']
  },

  // Persistence Layer
  {
    id: 'db_leads',
    title: 'Leads DB Handlers',
    layer: 'db',
    domain: 'booking',
    file: 'server/db/leads.ts',
    description: 'Operaciones CRUD en Supabase PostgreSQL con scoping forzoso por bandId.',
    linksTo: ['db_state_sync', 'schema_supabase'],
    tags: ['database', 'leads', 'supabase']
  },
  {
    id: 'db_lead_messages',
    title: 'Lead Messages & Thread DB',
    layer: 'db',
    domain: 'booking',
    file: 'server/db/leadMessages.ts',
    description: 'Registro histórico de mensajes enviados y recibidos por lead y sala.',
    linksTo: ['schema_supabase'],
    tags: ['database', 'messages', 'threads']
  },
  {
    id: 'db_repertoire',
    title: 'Repertoire DB Handlers',
    layer: 'db',
    domain: 'repertoire',
    file: 'server/db/repertoire.ts',
    description: 'Persistencia de canciones, pistas, energía y afinaciones.',
    linksTo: ['schema_supabase'],
    tags: ['database', 'repertoire']
  },
  {
    id: 'db_ai_ledger',
    title: 'AI Token Ledger',
    layer: 'db',
    domain: 'system',
    file: 'server/db/aiLedger.ts',
    description: 'Contabilidad exacta de tokens consumidos por banda y modelo para control de costes.',
    linksTo: ['schema_supabase'],
    tags: ['database', 'ledger', 'tokens', 'cost-control']
  },
  {
    id: 'db_state_sync',
    title: 'In-Memory State & Supabase Sync',
    layer: 'db',
    domain: 'system',
    file: 'server/state.ts',
    description: 'Copia en memoria de alta velocidad sincronizada con Supabase al arranque.',
    linksTo: ['schema_supabase'],
    tags: ['database', 'memory', 'sync']
  },
  {
    id: 'schema_supabase',
    title: 'Supabase PostgreSQL Schema',
    layer: 'schema',
    domain: 'system',
    file: 'supabase_schema.sql',
    description: 'Esquema relacional de tablas, índices pgvector, funciones y políticas RLS.',
    linksTo: [],
    tags: ['schema', 'postgresql', 'supabase', 'rls']
  },
  {
    id: 'agent_redactor',
    title: 'Agente Redactor (borradores de respuesta)',
    layer: 'agent',
    domain: 'booking',
    file: 'server/services/replyDrafting.ts',
    description: 'Redacta borradores de respuesta a salas. Nunca envía: el borrador pasa por aprobación humana.',
    linksTo: ['service_pitch_engine', 'db_lead_messages'],
    tags: ['agent', 'booking', 'human-in-the-loop']
  },
  {
    id: 'db_agent_schedule',
    title: 'Estado del Scheduler de agentes',
    layer: 'db',
    domain: 'system',
    file: 'server/db/agentSchedule.ts',
    description: 'Tabla agent_schedule_state: cuándo toca cada agente (Scout, Lector) y su último resultado.',
    linksTo: ['agent_scheduler', 'schema_supabase'],
    tags: ['db', 'scheduler']
  },
  {
    id: 'db_payments',
    title: 'Pagos y suscripciones (Stripe)',
    layer: 'db',
    domain: 'finances',
    file: 'server/db/payments.ts',
    description: 'Persistencia de pagos y suscripciones. Facturación desactivada en producción (ver BACKLOG).',
    linksTo: ['sec_trust_boundary', 'schema_supabase'],
    tags: ['db', 'billing', 'stripe']
  },
  {
    id: 'route_leads_enrichment',
    title: 'Ruta de enriquecimiento de salas',
    layer: 'route',
    domain: 'booking',
    file: 'server/routes/leads/enrichment.ts',
    description: 'Busca datos públicos de una sala (web, redes) para completar su ficha. Pasa por protección SSRF.',
    linksTo: ['sec_ssrf_guard', 'db_leads'],
    tags: ['route', 'booking', 'enrichment']
  }
];

// Falla en voz alta si un nodo enlaza a otro que no existe (así no vuelven los enlaces rotos).
for (const nodo of NODES) {
  for (const destino of nodo.linksTo) {
    if (!NODES.some((n) => n.id === destino)) {
      throw new Error(`[graph] ${nodo.id} enlaza a un nodo inexistente: ${destino}`);
    }
  }
}

// ─── Capa automática ───────────────────────────────────────────────────────────────────────────
// Los nodos de arriba son la parte curada a mano (descripciones de los módulos clave). Todo lo demás
// sale del código: un nodo por fichero de src/ y server/, con sus enlaces sacados de los imports
// reales. Así el grafo no depende de que alguien se acuerde de editar una lista.

const RAIZ = process.cwd();
const DIRS_ESCANEO = ['src', 'server'];
const EXT = ['.ts', '.tsx'];

const esTest = (f: string) => /\.(test|spec)\.tsx?$/.test(f) || f.includes('__tests__') || f.endsWith('.d.ts');

const RAIZ_SUELTOS = ['server.ts'];

function recorrerTodo(): string[] {
  const salida: string[] = [];
  const recorrer = (dir: string) => {
    const abs = path.join(RAIZ, dir);
    if (!fs.existsSync(abs)) return;
    for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
      const rel = `${dir}/${e.name}`;
      if (e.isDirectory()) {
        if (e.name !== 'node_modules') recorrer(rel);
      } else if (EXT.includes(path.extname(e.name))) {
        salida.push(rel);
      }
    }
  };
  DIRS_ESCANEO.forEach(recorrer);
  RAIZ_SUELTOS.filter((f) => fs.existsSync(path.join(RAIZ, f))).forEach((f) => salida.push(f));
  return salida.sort();
}

export function escanearFicheros(): string[] {
  return recorrerTodo().filter((f) => !esTest(f));
}

function escanearTests(): string[] {
  return recorrerTodo().filter((f) => esTest(f) && !f.endsWith('.d.ts'));
}

// ─── Tablas de Supabase ─────────────────────────────────────────────────────────────────────────
const FUENTES_SQL = ['supabase_schema.sql', 'supabase_migration_only_new.sql', 'server/migrations/runner.ts'];

function ficherosSql(): string[] {
  const sueltos: string[] = [];
  const recorrer = (dir: string) => {
    const abs = path.join(RAIZ, dir);
    if (!fs.existsSync(abs)) return;
    for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
      if (e.isDirectory()) recorrer(`${dir}/${e.name}`);
      else if (e.name.endsWith('.sql')) sueltos.push(`${dir}/${e.name}`);
    }
  };
  recorrer('supabase');
  // El esquema base va primero: así la tabla se "define en" él y no en la última migración que la toca.
  return [...FUENTES_SQL, ...sueltos.sort()].filter((f) => fs.existsSync(path.join(RAIZ, f)));
}

interface Tabla { nombre: string; columnas: string[]; definidaEn: string[] }

function cuerpoParentesis(texto: string, desde: number): string {
  let prof = 0;
  for (let i = desde; i < texto.length; i++) {
    if (texto[i] === '(') prof++;
    else if (texto[i] === ')' && --prof === 0) return texto.slice(desde + 1, i);
  }
  return '';
}

export function extraerTablas(): Tabla[] {
  const tablas = new Map<string, Tabla>();
  const get = (nombre: string, fichero: string) => {
    const t = tablas.get(nombre) ?? { nombre, columnas: [], definidaEn: [] };
    if (!t.definidaEn.includes(fichero)) t.definidaEn.push(fichero);
    tablas.set(nombre, t);
    return t;
  };
  const anadir = (t: Tabla, col: string) => { if (!t.columnas.includes(col)) t.columnas.push(col); };
  const NO_COLUMNA = /^(CONSTRAINT|PRIMARY|FOREIGN|UNIQUE|CHECK|EXCLUDE|LIKE)$/i;
  for (const f of ficherosSql()) {
    const texto = fs.readFileSync(path.join(RAIZ, f), 'utf-8');
    for (const m of texto.matchAll(/CREATE TABLE(?: IF NOT EXISTS)?\s+(?:public\.)?"?([a-z_][a-z_0-9]*)"?\s*\(/gi)) {
      const t = get(m[1].toLowerCase(), f);
      const cuerpo = cuerpoParentesis(texto, m.index! + m[0].length - 1);
      let prof = 0, trozo = '';
      const trozos: string[] = [];
      for (const ch of cuerpo) {
        if (ch === '(') prof++;
        if (ch === ')') prof--;
        if (ch === ',' && prof === 0) { trozos.push(trozo); trozo = ''; } else trozo += ch;
      }
      trozos.push(trozo);
      for (const tr of trozos) {
        const tok = tr.replace(/--[^\n]*/g, '').trim().split(/\s+/)[0]?.replace(/"/g, '');
        if (tok && /^[a-z_][a-z_0-9]*$/i.test(tok) && !NO_COLUMNA.test(tok)) anadir(t, tok.toLowerCase());
      }
    }
    for (const m of texto.matchAll(/ALTER TABLE\s+(?:IF EXISTS\s+)?(?:ONLY\s+)?(?:public\.)?"?([a-z_][a-z_0-9]*)"?([^;]*);/gi)) {
      const nombre = m[1].toLowerCase();
      for (const c of m[2].matchAll(/ADD COLUMN(?: IF NOT EXISTS)?\s+"?([a-z_][a-z_0-9]*)"?/gi)) {
        anadir(get(nombre, f), c[1].toLowerCase());
      }
    }
  }
  return [...tablas.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
}

const slug = (f: string) => f.replace(/\.tsx?$/, '').replace(/[^A-Za-z0-9]+/g, '_');

function resolverImport(desde: string, spec: string, existentes: Set<string>): string | null {
  let base: string;
  if (spec.startsWith('@/')) base = spec.slice(2);
  else if (spec.startsWith('.')) base = path.posix.normalize(path.posix.join(path.posix.dirname(desde), spec));
  else return null;
  const sinJs = base.replace(/\.(js|jsx)$/, '');
  for (const cand of [base, ...EXT.map((x) => sinJs + x), ...EXT.map((x) => `${base}/index${x}`)]) {
    if (existentes.has(cand)) return cand;
  }
  return null;
}

function capaDe(f: string): GraphNode['layer'] {
  if (/agent/i.test(f)) return 'agent';
  if (/(ssrf|middleware|trust|sanitiz|security|auth)/i.test(f)) return 'security';
  if (f === 'server.ts' || f.startsWith('server/routes')) return 'route';
  if (f.startsWith('server/db')) return 'db';
  if (f.startsWith('server/')) return 'service';
  if (f.startsWith('src/hooks')) return 'hook';
  if (f.startsWith('src/components') || f.startsWith('src/pages') || f === 'src/App.tsx') return 'frontend';
  return 'service';
}

function dominioDe(f: string): GraphNode['domain'] {
  if (/(lead|booking|venue|crm|pitch|scout|enrich)/i.test(f)) return 'booking';
  if (/(repertoire|song|setlist|stem|iris|audio|studio|atril|jam|mixer|multitrack|chord|lyric|letra)/i.test(f)) return 'repertoire';
  if (/(payment|finance|invoice|stripe|billing|expense|merch)/i.test(f)) return 'finances';
  if (/epk/i.test(f)) return 'epk';
  if (/(auth|login|session)/i.test(f)) return 'auth';
  if (/(reel|social|fan|instagram|tiktok)/i.test(f)) return 'social';
  return 'system';
}

function descripcionDe(texto: string): string {
  const cab = texto.match(/^\s*(?:\/\*\*?([\s\S]*?)\*\/|((?:\/\/[^\n]*\n?)+))/);
  if (cab) {
    const limpio = (cab[1] ?? cab[2] ?? '')
      .split('\n')
      .map((l) => l.replace(/^\s*(\*|\/\/)\s?/, '').trim())
      .filter(Boolean)[0];
    if (limpio && limpio.length > 15) return limpio.slice(0, 200);
  }
  const exports = [...texto.matchAll(/^export\s+(?:default\s+)?(?:async\s+)?(?:const|function|class|interface|type|enum)\s+(\w+)/gm)].map((m) => m[1]);
  return exports.length ? `Exporta: ${[...new Set(exports)].slice(0, 8).join(', ')}.` : 'Módulo sin exportaciones con nombre.';
}

export function construirNodos(): GraphNode[] {
  const ficheros = escanearFicheros();
  const existentes = new Set(ficheros);
  const curadoPorFichero = new Map(NODES.map((n) => [n.file, n]));
  const idDe = new Map<string, string>();
  const usados = new Set(NODES.map((n) => n.id));
  for (const f of ficheros) {
    const cur = curadoPorFichero.get(f);
    if (cur) { idDe.set(f, cur.id); continue; }
    let id = slug(f);
    if (usados.has(id)) id = `${id}_${path.extname(f).slice(1)}`;
    usados.add(id);
    idDe.set(f, id);
  }

  const tablas = extraerTablas();
  const nombresTabla = new Set(tablas.map((t) => t.nombre));
  const idTabla = (n: string) => `tabla_${n}`;
  const testsDe = new Map<string, string[]>();
  for (const t of escanearTests()) {
    const imports = ts.preProcessFile(fs.readFileSync(path.join(RAIZ, t), 'utf-8'), true, true).importedFiles.map((i) => i.fileName);
    for (const spec of imports) {
      const r = resolverImport(t, spec, existentes);
      if (r) testsDe.set(r, [...(testsDe.get(r) ?? []), t]);
    }
  }
  const tablasUsadas = (texto: string): string[] => {
    const usadas = new Set<string>();
    for (const m of texto.matchAll(/\.from\(\s*['"`]([a-z_][a-z_0-9]*)['"`]/g)) if (nombresTabla.has(m[1])) usadas.add(m[1]);
    for (const m of texto.matchAll(/\b(?:FROM|INTO|UPDATE|JOIN)\s+(?:public\.)?"?([a-z_][a-z_0-9]*)"?/g)) if (nombresTabla.has(m[1])) usadas.add(m[1]);
    return [...usadas].map(idTabla);
  };

  const nodos: GraphNode[] = NODES.filter((n) => !existentes.has(n.file)).map((n) => ({ ...n }));
  for (const f of ficheros) {
    const texto = fs.readFileSync(path.join(RAIZ, f), 'utf-8');
    const imports = ts.preProcessFile(texto, true, true).importedFiles.map((i) => i.fileName);
    const destinos = new Set<string>();
    for (const spec of imports) {
      const r = resolverImport(f, spec, existentes);
      if (r && r !== f) destinos.add(idDe.get(r)!);
    }
    for (const t of tablasUsadas(texto)) destinos.add(t);
    const tests = [...new Set(testsDe.get(f) ?? [])].sort();
    const cur = curadoPorFichero.get(f);
    if (cur) {
      nodos.push({ ...cur, linksTo: [...new Set([...cur.linksTo, ...destinos])].sort(), tests });
    } else {
      const layer = capaDe(f);
      const domain = dominioDe(f);
      nodos.push({
        id: idDe.get(f)!,
        title: f,
        layer,
        domain,
        file: f,
        description: descripcionDe(texto),
        linksTo: [...destinos].sort(),
        tags: [layer, domain, 'auto'],
        tests,
      });
    }
  }
  for (const t of tablas) {
    nodos.push({
      id: idTabla(t.nombre),
      title: `tabla ${t.nombre}`,
      layer: 'schema',
      domain: dominioDe(t.nombre),
      file: t.definidaEn[0],
      description: `Tabla de Supabase \`${t.nombre}\` (${t.columnas.length} columnas).`,
      linksTo: [],
      tags: ['schema', 'tabla', 'auto'],
      columnas: t.columnas,
      definidaEn: t.definidaEn,
    });
  }
  const esquema = nodos.find((n) => n.id === 'schema_supabase');
  if (esquema) esquema.linksTo = [...new Set([...esquema.linksTo, ...tablas.map((t) => idTabla(t.nombre))])].sort();
  return nodos.sort((a, b) => a.id.localeCompare(b.id));
}

// Cada fichero tiene como mucho un nodo curado (si no, uno taparía al otro en silencio).
{
  const vistos = new Set<string>();
  for (const n of NODES) {
    if (vistos.has(n.file)) throw new Error(`[graph] dos nodos curados apuntan al mismo fichero: ${n.file}`);
    vistos.add(n.file);
  }
}

export function generateObsidianGraph(outputDir = 'docs/knowledge_graph') {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const TODOS = construirNodos();
  const nodesMap = new Map(TODOS.map((n) => [n.id, n]));
  const idsGenerados = new Set(TODOS.map((n) => `${n.id}.md`).concat('index.md'));
  for (const viejo of fs.readdirSync(outputDir)) {
    if (viejo.endsWith('.md') && !idsGenerados.has(viejo)) fs.rmSync(path.join(outputDir, viejo));
  }

  // 1. Generate Individual Node Markdown Files with [[Wikilinks]]
  for (const node of TODOS) {
    const linkedWikilinks = node.linksTo
      .map((targetId) => {
        const targetNode = nodesMap.get(targetId);
        if (!targetNode) return `- [[${targetId}]]`;
        return `- [[${targetNode.id}|${targetNode.title}]] *(Layer: #${targetNode.layer}, Domain: #${targetNode.domain})*`;
      })
      .join('\n');

    const backlinks = TODOS.filter((n) => n.linksTo.includes(node.id))
      .map((sourceNode) => `- [[${sourceNode.id}|${sourceNode.title}]] *(from #${sourceNode.layer})*`)
      .join('\n');

    const content = `---
id: ${node.id}
title: "${node.title}"
layer: ${node.layer}
domain: ${node.domain}
file: "${node.file}"
tags: [${node.tags.map((t) => `"${t}"`).join(', ')}]
---

# 📌 ${node.title}

> **Ubicación:** \`${node.file}\`  
> **Capa:** \`#layer/${node.layer}\` | **Dominio:** \`#domain/${node.domain}\`

## 📖 Descripción
${node.description}

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
${linkedWikilinks || '_Sin dependencias salientes directas._'}

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
${backlinks || '_Sin llamadas entrantes indexadas._'}

---

${node.columnas ? `## 🗄️ Columnas\n${node.columnas.map((c) => `- \`${c}\``).join('\n')}\n\n**Definida en:** ${(node.definidaEn ?? []).map((d) => `\`${d}\``).join(', ')}\n\n---\n\n` : ''}${node.tests?.length ? `## 🧪 Tests que lo cubren\n${node.tests.map((t) => `- \`${t}\``).join('\n')}\n\n---\n\n` : ''}## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de \`band_id\`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
`;

    fs.writeFileSync(path.join(outputDir, `${node.id}.md`), content, 'utf-8');
  }

  // 2. Generate Index Overview
  const entrantes = new Map<string, number>();
  for (const n of TODOS) for (const d of n.linksTo) entrantes.set(d, (entrantes.get(d) ?? 0) + 1);
  const porCapa = new Map<string, number>();
  for (const n of TODOS) porCapa.set(n.layer, (porCapa.get(n.layer) ?? 0) + 1);
  const calientes = [...TODOS]
    .sort((a, b) => (entrantes.get(b.id) ?? 0) - (entrantes.get(a.id) ?? 0) || a.id.localeCompare(b.id))
    .slice(0, 20)
    .map((n) => `- [[${n.id}|${n.title}]] — ${entrantes.get(n.id) ?? 0} ficheros dependen de él`)
    .join('\n');
  const mapaAuto = `## 🤖 Mapa automático (generado desde los imports reales)

${TODOS.length} nodos: ${[...porCapa.entries()].sort().map(([c, n]) => `${n} ${c}`).join(' · ')}.
No se edita a mano: lo regenera \`npm run graph:sync\` (hook de pre-commit) y el test \`grafoConocimiento\` falla si queda desfasado.

### 🔥 Los 20 ficheros más importados
${calientes}

---
`;
  const indexContent = `---
title: "BandManager.io Architecture Knowledge Graph"
tags: ["obsidian", "architecture", "graphify", "tfm"]
---

# 🗺️ BandManager.io — Obsidian Knowledge Graph

Este grafo de conocimiento interactivo mapea de forma determinista todas las capas y módulos del sistema para **Obsidian**, herramientas de desarrollo y agentes de IA.

---

## 🧭 Vista por Dominios Principales

### 🎯 1. Booking CRM & Agentes de IA
- [[ui_booking_crm|Panel Principal de Booking CRM]]
- [[ui_leads_table|Tabla de Salas & Leads]]
- [[ui_venue_detail|Ficha Técnica & Simulador de Pitch]]
- [[agent_scheduler|Scheduler In-Process (tick 24 h por defecto)]]
- [[agent_enviador|Enviador Agent (Human-in-the-Loop)]]
- [[agent_lector|Lector Agent (Gmail OAuth2/IMAP)]]
- [[service_pitch_engine|Motor Multi-Modelo (Gemini / DeepSeek / OpenAI)]]

### 🔒 2. Seguridad & Trust Boundary
- [[sec_trust_boundary|Límite de Confianza (getTargetBandId)]]
- [[sec_ssrf_guard|Protección SSRF (esUrlExternaSegura)]]
- [[sec_prompt_safety|Sanitizador Anti-Prompt Injection]]

### 🎵 3. Repertorio, Audio & Setlists
- [[ui_repertoire_setlists|Repertorio & Setlists UI]]
- [[db_repertoire|Manejadores de Base de Datos de Repertorio]]

### 💾 4. Persistencia & Estado
- [[db_leads|Manejador de Leads en Supabase]]
- [[db_lead_messages|Historial de Mensajes]]
- [[db_ai_ledger|Contabilidad de Tokens (aiLedger)]]
- [[db_state_sync|Sincronización de Estado en Memoria]]
- [[schema_supabase|Esquema PostgreSQL de Supabase]]

---

${mapaAuto}
## 💡 Cómo Visualizar en Obsidian
1. Abre **Obsidian**.
2. Selecciona **Open folder as vault** y abre la carpeta \`docs/knowledge_graph\`.
3. Pulsa \`Ctrl + G\` (o \`Cmd + G\`) para abrir el **Interactive Graph View**.
4. ¡Disfruta de la visualización en 2D/3D con filtros por capa y dominio!
`;

  fs.writeFileSync(path.join(outputDir, 'index.md'), indexContent, 'utf-8');
  console.log(`✅ Obsidian Knowledge Graph generated successfully in: ${outputDir}`);
}

// Auto-run if executed directly
if (process.argv[1]?.includes('generate_obsidian_graph.ts')) {
  generateObsidianGraph();
}
