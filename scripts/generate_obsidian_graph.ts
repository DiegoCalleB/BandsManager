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
  layer: 'frontend' | 'hook' | 'route' | 'service' | 'db' | 'schema' | 'security' | 'agent' | 'external' | 'feature';
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

// Clave foránea: REFERENCES otra_tabla(...)
const REFERENCIA = /REFERENCES\s+(?:public\.)?"?([a-z_][a-z_0-9]*)"?/gi;
interface Tabla { nombre: string; columnas: string[]; definidaEn: string[]; fk: string[] }

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
    const t = tablas.get(nombre) ?? { nombre, columnas: [], definidaEn: [], fk: [] };
    if (!t.definidaEn.includes(fichero)) t.definidaEn.push(fichero);
    tablas.set(nombre, t);
    return t;
  };
  const anadir = (t: Tabla, col: string) => { if (!t.columnas.includes(col)) t.columnas.push(col); };
  const anadirFk = (t: Tabla, otra: string) => { const o = otra.toLowerCase(); if (o !== t.nombre && !t.fk.includes(o)) t.fk.push(o); };
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
      for (const r of cuerpo.matchAll(REFERENCIA)) anadirFk(t, r[1]);
    }
    for (const m of texto.matchAll(/ALTER TABLE\s+(?:IF EXISTS\s+)?(?:ONLY\s+)?(?:public\.)?"?([a-z_][a-z_0-9]*)"?([^;]*);/gi)) {
      const nombre = m[1].toLowerCase();
      for (const c of m[2].matchAll(/ADD COLUMN(?: IF NOT EXISTS)?\s+"?([a-z_][a-z_0-9]*)"?/gi)) {
        anadir(get(nombre, f), c[1].toLowerCase());
      }
      for (const r of m[2].matchAll(REFERENCIA)) anadirFk(get(nombre, f), r[1]);
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

// Rutas Express reales: prefijos de server.ts y de los routers anidados (router.use).
// Cada ruta lleva sus segmentos ya unidos al prefijo, con ':param' para los parámetros.
const segmentosDe = (ruta: string) => ruta.split('/').filter(Boolean);
function rutasApi(): { segmentos: string[]; fichero: string }[] {
  const salida: { segmentos: string[]; fichero: string }[] = [];
  const existentes = new Set(escanearFicheros());
  const leer = (f: string) => {
    const texto = fs.readFileSync(path.join(RAIZ, f), 'utf-8');
    const mapa = new Map<string, string>();
    for (const m of texto.matchAll(/import\s+(\w+)\s*(?:,\s*\{[^}]*\}\s*)?from\s*['"]([^'"]+)['"]/g)) {
      const r = resolverImport(f, m[2], existentes);
      if (r) mapa.set(m[1], r);
    }
    return { texto, mapa };
  };
  const recorrer = (f: string, prefijo: string, profundidad: number) => {
    if (profundidad > 5) return;
    const { texto, mapa } = leer(f);
    for (const m of texto.matchAll(/\b\w*[Rr]outer\.(?:get|post|put|patch|delete|all)\(\s*['"`]([^'"`]*)/g)) {
      salida.push({ segmentos: segmentosDe(`${prefijo}/${m[1]}`), fichero: f });
    }
    for (const m of texto.matchAll(/\.use\(\s*(?:['"`]([^'"`]*)['"`]\s*,\s*)?(\w+)\s*\)/g)) {
      const sub = mapa.get(m[2]);
      if (sub && sub !== f) recorrer(sub, `${prefijo}/${m[1] ?? ''}`, profundidad + 1);
    }
  };
  const { texto, mapa } = leer('server.ts');
  for (const m of texto.matchAll(/\.use\(\s*(?:['"`]([^'"`]*)['"`]\s*,\s*)?(\w+)\s*\)/g)) {
    const f = mapa.get(m[2]);
    if (f) recorrer(f, m[1] ?? '', 0);
  }
  return salida;
}

// Llamadas del frontend a /api/... (las expresiones ${x} cuentan como parámetro).
const urlsApiDe = (texto: string): string[] =>
  [...texto.matchAll(/['"`](\/api\/[^'"`\s?#]*)/g)].map((m) => segmentosDe(m[1].replace(/\$\{[^}]*\}/g, ':p')).join('/'));

// Compara segmento a segmento; un segmento con ':' (parámetro o plantilla) casa con cualquier valor.
const coincideRuta = (url: string, patron: string[]): boolean => {
  const seg = url.split('/');
  return seg.length === patron.length && patron.every((p, i) => p.includes(':') || seg[i].includes(':') || seg[i] === p);
};


// Servicios externos: un nodo ext_* por proveedor, enlazado desde todo fichero cuyo código lo usa.
const PROVEEDORES: { id: string; title: string; descripcion: string; re: RegExp }[] = [
  { id: 'ext_gemini', title: 'Gemini (Google GenAI)', descripcion: 'Modelos de Google para pitch, chat, scouting y análisis musical.', re: /@google\/genai|generativelanguage\.googleapis\.com/ },
  { id: 'ext_supabase', title: 'Supabase (Postgres)', descripcion: 'Base de datos y cliente `@supabase/supabase-js`.', re: /@supabase\/supabase-js/ },
  { id: 'ext_supabase_storage', title: 'Supabase Storage', descripcion: 'Buckets de audio, imágenes y PDFs (`storage.from(...)`).', re: /\.storage\s*\.from\(/ },
  { id: 'ext_stripe', title: 'Stripe', descripcion: 'Cobros, suscripciones y planes.', re: /['"]stripe['"]|api\.stripe\.com/ },
  { id: 'ext_resend', title: 'Resend', descripcion: 'Email transaccional.', re: /['"]resend['"]|api\.resend\.com/ },
  { id: 'ext_correo_smtp_imap', title: 'Correo SMTP / IMAP', descripcion: 'Envío y lectura de correo (nodemailer, imapflow, mailparser).', re: /nodemailer|imapflow|mailparser/ },
  { id: 'ext_google_oauth_gmail', title: 'Google OAuth / Gmail API', descripcion: 'Inicio de sesión con Google y lectura/envío de Gmail.', re: /accounts\.google\.com|gmail\.googleapis|oauth2\.googleapis/ },
  { id: 'ext_spotify', title: 'Spotify', descripcion: 'Métricas de artista, audiencia y previews.', re: /api\.spotify\.com|accounts\.spotify\.com/ },
  { id: 'ext_replicate', title: 'Replicate', descripcion: 'Separación de pistas (Iris) y transcripción de letras.', re: /api\.replicate\.com|ReplicateService/ },
  { id: 'ext_fal', title: 'fal.ai', descripcion: 'Separación de pistas en la nube.', re: /fal\.run|queue\.fal\.ai|FalAiService/ },
  { id: 'ext_sentry', title: 'Sentry', descripcion: 'Seguimiento de errores en cliente y servidor.', re: /@sentry\// },
  { id: 'ext_ffmpeg', title: 'FFmpeg', descripcion: 'Procesado de audio y vídeo en servidor.', re: /ffmpeg/ },
];

// Funciones clave de la aplicación: cada una agrupa pantalla → hook → ruta → servicio/agente → tabla → proveedor.
// `entradas` son los ficheros de arranque; rutas, tablas y proveedores se deducen del propio grafo.
const FUNCIONES: { id: string; title: string; domain: GraphNode['domain']; descripcion: string; entradas: string[] }[] = [
  { id: 'fn_acceso_sesion', title: 'Acceso y sesión', domain: 'auth', descripcion: 'Login (email o Google), sesión por cookie y multi-banda: de quién es cada petición.', entradas: ['src/components/LoginModal.tsx', 'src/hooks/useAuth.ts', 'server/auth.ts', 'server/routes/users.ts', 'server/routes/bands.ts', 'src/utils/googleAuth.ts'] },
  { id: 'fn_booking_crm', title: 'Booking CRM y pitch', domain: 'booking', descripcion: 'Embudo de salas y festivales: leads, enriquecimiento, pitch con IA, respuestas y seguimiento.', entradas: ['src/components/BookingCRM.tsx', 'src/hooks/useBookingPipeline.ts', 'server/routes/leads.ts', 'server/routes/deals.ts', 'server/routes/campaigns.ts', 'server/services/pitchEngine.ts', 'server/services/replyDrafting.ts'] },
  { id: 'fn_agentes_correo', title: 'Agentes de correo', domain: 'booking', descripcion: 'Scheduler, lector (Gmail/IMAP) y enviador con humano en el bucle.', entradas: ['server/routes/agent.ts', 'server/routes/gmailOAuth.ts', 'server/services/agentScheduler.ts', 'server/services/agentEngine.ts', 'server/services/agentQueueWorker.ts', 'server/services/lectorAgent.ts', 'server/services/emailAgentClient.ts', 'server/services/gmailApiClient.ts'] },
  { id: 'fn_scout_salas', title: 'Búsqueda de salas y festivales', domain: 'booking', descripcion: 'Descubrimiento de salas, eventos y contactos desde fuentes abiertas, mapas y redes.', entradas: ['src/components/VenueMap.tsx', 'server/auto_enrichment.ts', 'server/services/multiSourceVenueDiscoveryService.ts', 'server/services/googlePlacesVenueService.ts', 'server/services/venueIntelligenceService.ts', 'server/services/bandsintownVenueService.ts', 'server/db/leads.ts'] },
  { id: 'fn_repertorio_setlists', title: 'Repertorio y setlists', domain: 'repertoire', descripcion: 'Catálogo de canciones, setlists, atril, modo escenario y práctica.', entradas: ['src/components/RepertorioSetlists.tsx', 'src/components/SetlistPerformanceView.tsx', 'src/components/Atril.tsx', 'server/routes/repertorio.ts', 'server/routes/songs/index.ts', 'server/services/acordesCancion.ts', 'server/services/letraCancion.ts', 'server/db/repertoire.ts'] },
  { id: 'fn_iris_estudio', title: 'Estudio de canción e Iris (stems)', domain: 'repertoire', descripcion: 'Separación de pistas, mezcla, ideas de audio y descarga desde el estudio de canción.', entradas: ['src/components/SongStudioModal.tsx', 'src/hooks/useSeparacionIris.ts', 'src/utils/separacionIris.ts', 'server/routes/ai_music.ts', 'server/routes/upload.ts', 'server/services/audioSeparator/index.ts', 'server/services/stemPredictionReconciler.ts', 'server/services/stemStorageRetryQueue.ts', 'server/db/stemsCache.ts'] },
  { id: 'fn_ensayos', title: 'Ensayos', domain: 'repertoire', descripcion: 'Convocatorias, orden del día, acta y seguimiento del ensayo.', entradas: ['src/components/ensayos/EnsayosManager.tsx', 'src/hooks/useSeguimientoEnsayo.ts', 'src/components/PracticeModePanel.tsx', 'server/db/rehearsals.ts'] },
  { id: 'fn_conciertos_qr', title: 'Conciertos, QR y calendario', domain: 'booking', descripcion: 'Bolos confirmados, calendario, página pública del concierto, QR y enlaces cortos.', entradas: ['src/components/CalendarView.tsx', 'src/components/QrExportModal.tsx', 'server/routes/concerts.ts', 'server/routes/paginaConcierto.ts', 'server/routes/campanaConcierto.ts', 'server/routes/enlacesCortos.ts', 'server/routes/concert_to_album.ts', 'server/db/concerts.ts'] },
  { id: 'fn_reels_social', title: 'Reels y redes sociales', domain: 'social', descripcion: 'Generación de reels virales, publicaciones y plan de crecimiento.', entradas: ['src/components/ReelsCenter.tsx', 'server/routes/reels.ts', 'server/routes/posts.ts', 'server/services/socialPublisher.ts', 'server/utils/reelsCore.ts', 'server/db/reelAnalyses.ts'] },
  { id: 'fn_fans_epk', title: 'Fans y EPK', domain: 'epk', descripcion: 'Captación de fans, landing pública y dossier de prensa (EPK).', entradas: ['src/components/FansPanel.tsx', 'src/components/FansLanding.tsx', 'src/components/EPKManager.tsx', 'src/components/PublicEPK.tsx', 'server/routes/epk_fans.ts', 'server/services/perfilPublicoBanda.ts', 'server/db/epk.ts', 'server/db/fans.ts'] },
  { id: 'fn_finanzas_planes', title: 'Finanzas, merchan y planes', domain: 'finances', descripcion: 'Ingresos, gastos, merchan, donaciones, planes y cobro con Stripe.', entradas: ['src/components/Finanzas.tsx', 'src/components/Merchan.tsx', 'src/components/Planes.tsx', 'src/components/CheckoutButton.tsx', 'server/routes/billing.ts', 'server/routes/donations.ts', 'server/services/financialBreakEvenService.ts', 'server/db/payments.ts'] },
  { id: 'fn_gira', title: 'Tour Manager', domain: 'booking', descripcion: 'Planificación de giras, logística y rutas entre bolos.', entradas: ['src/components/TourManager.tsx', 'server/routes/tours.ts', 'server/controllers/tours.controller.ts', 'server/db/tours.ts', 'server/services/tourLogisticsService.ts'] },
  { id: 'fn_metricas_panel', title: 'Panel y métricas', domain: 'system', descripcion: 'Dashboard de la banda con métricas de Spotify, redes y actividad.', entradas: ['src/components/Dashboard.tsx', 'server/routes/metrics.ts', 'server/routes/spotify.ts', 'server/services/metricasBandaService.ts', 'server/services/spotifyService.ts'] },
  { id: 'fn_asistente_ia', title: 'Asistente de IA (chat)', domain: 'system', descripcion: 'Chatbot con herramientas que lee y actúa sobre los datos de la banda.', entradas: ['src/components/Chatbot.tsx', 'server/routes/chat.ts', 'server/services/chatTools.ts', 'server/ai.ts'] },
];

// Una función clave pinta: sus entradas, las rutas, tablas y proveedores que alcanza (hasta 2 saltos, sin pasar por utilidades compartidas).
const MAX_SALTOS_FUNCION = 2;
const MAX_ENTRANTES_COMPARTIDO = 25;
// Proveedores que usa todo el mundo: enlazarlos desde cada función solo añade ruido.
const TRANSVERSALES = new Set(['ext_sentry', 'ext_supabase']);

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

  const rutas = rutasApi();
  const appTexto = fs.readFileSync(path.join(RAIZ, 'src/App.tsx'), 'utf-8');
  const pantallas = new Set(
    ts.preProcessFile(appTexto, true, true).importedFiles
      .map((i) => resolverImport('src/App.tsx', i.fileName, existentes))
      .filter((r): r is string => !!r && /^src\/(components|pages)\//.test(r)),
  );
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
    for (const p of PROVEEDORES) if (p.re.test(texto)) destinos.add(p.id);
    for (const url of urlsApiDe(texto)) {
      for (const r of rutas) if (coincideRuta(url, r.segmentos)) destinos.add(idDe.get(r.fichero)!);
    }
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
        tags: [layer, domain, 'auto', ...(pantallas.has(f) ? ['pantalla'] : [])],
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
      linksTo: t.fk.filter((o) => nombresTabla.has(o)).map(idTabla).sort(),
      tags: ['schema', 'tabla', 'auto'],
      columnas: t.columnas,
      definidaEn: t.definidaEn,
    });
  }
  for (const p of PROVEEDORES) {
    nodos.push({
      id: p.id,
      title: p.title,
      layer: 'external',
      domain: 'system',
      file: 'servicio externo',
      description: p.descripcion,
      linksTo: [],
      tags: ['external', 'auto'],
    });
  }
  const entrantes = new Map<string, number>();
  for (const n of nodos) for (const d of n.linksTo) entrantes.set(d, (entrantes.get(d) ?? 0) + 1);
  const porId = new Map(nodos.map((n) => [n.id, n]));
  for (const fn of FUNCIONES) {
    const ids = fn.entradas.map((f) => {
      const id = idDe.get(f);
      if (!id) throw new Error(`[graph] la función ${fn.id} apunta a un fichero que no existe: ${f}`);
      return id;
    });
    const vistos = new Set(ids);
    let frontera = [...ids];
    for (let salto = 0; salto < MAX_SALTOS_FUNCION; salto++) {
      const siguiente: string[] = [];
      for (const id of frontera) {
        for (const d of porId.get(id)?.linksTo ?? []) {
          const nodo = porId.get(d);
          if (!nodo || vistos.has(d) || ['schema', 'security', 'external', 'feature'].includes(nodo.layer)) continue;
          if ((entrantes.get(d) ?? 0) > MAX_ENTRANTES_COMPARTIDO) continue;
          vistos.add(d);
          siguiente.push(d);
        }
      }
      frontera = siguiente;
    }
    const destinos = new Set(ids);
    for (const id of vistos) {
      const nodo = porId.get(id)!;
      if (nodo.layer === 'route' || nodo.layer === 'db') destinos.add(id);
      if (nodo.layer !== 'db' || ids.includes(id)) for (const d of nodo.linksTo) if (d.startsWith('tabla_') || (d.startsWith('ext_') && !TRANSVERSALES.has(d))) destinos.add(d);
    }
    nodos.push({
      id: fn.id,
      title: fn.title,
      layer: 'feature',
      domain: fn.domain,
      file: fn.entradas[0],
      description: fn.descripcion,
      linksTo: [...destinos].sort(),
      tags: ['feature', fn.domain, 'auto'],
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
  const funciones = TODOS.filter((n) => n.layer === 'feature')
    .map((n) => `- [[${n.id}|${n.title}]] — ${n.description}`)
    .join('\n');
  const proveedores = TODOS.filter((n) => n.layer === 'external')
    .map((n) => `- [[${n.id}|${n.title}]] — ${entrantes.get(n.id) ?? 0} ficheros lo usan`)
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

## ⭐ Funciones clave de la aplicación
Cada una enlaza pantalla → ruta → servicio/agente → tabla → proveedor externo. Abre una y expande sus conexiones.
${funciones}

## 🌐 Servicios externos
${proveedores}

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
