/**
 * Generator of Obsidian-Compatible Architecture & Dependency Graph
 * Generates an interactive Markdown Knowledge Graph with Bidirectional Wikilinks ([[Node]])
 * Compatible with Obsidian Graph View, Foam, and Agentic Navigation.
 */

import fs from 'node:fs';
import path from 'node:path';

interface GraphNode {
  id: string;
  title: string;
  layer: 'frontend' | 'hook' | 'route' | 'service' | 'db' | 'schema' | 'security' | 'agent';
  domain: 'booking' | 'repertoire' | 'finances' | 'epk' | 'auth' | 'system' | 'social';
  file: string;
  description: string;
  linksTo: string[];
  tags: string[];
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
    description: 'Bucle in-process (60s tick) que orquesta el Scout, Enviador y Lector.',
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
    description: 'Monitoriza respuestas entrantes de salas vía Gmail OAuth2 / IMAP cada ~60s.',
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
  }
];

export function generateObsidianGraph(outputDir = 'docs/knowledge_graph') {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const nodesMap = new Map(NODES.map((n) => [n.id, n]));

  // 1. Generate Individual Node Markdown Files with [[Wikilinks]]
  for (const node of NODES) {
    const linkedWikilinks = node.linksTo
      .map((targetId) => {
        const targetNode = nodesMap.get(targetId);
        if (!targetNode) return `- [[${targetId}]]`;
        return `- [[${targetNode.id}|${targetNode.title}]] *(Layer: #${targetNode.layer}, Domain: #${targetNode.domain})*`;
      })
      .join('\n');

    const backlinks = NODES.filter((n) => n.linksTo.includes(node.id))
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

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de \`band_id\`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
`;

    fs.writeFileSync(path.join(outputDir, `${node.id}.md`), content, 'utf-8');
  }

  // 2. Generate Index Overview
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
- [[agent_scheduler|Scheduler In-Process (60s)]]
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
