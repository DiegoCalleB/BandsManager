/**
 * Sincronización del catálogo compartido de salas (fase 1).
 *
 * Recorre los leads de todas las bandas, agrupa los que son la misma sala, saca solo sus datos públicos, calcula la
 * fiabilidad y enlaza cada lead con su sala (`leads.sala_id`). Es idempotente y tiene modo simulación, que informa
 * de lo que haría sin escribir nada. Solo lo usa el servidor: nada de esto llega a una ruta pública.
 *
 * Depende de un puerto (`PuertoCatalogo`), no de Supabase: el adaptador real vive en server/db/salasCatalogo.ts y los
 * tests usan uno en memoria.
 */
import type { EstadoNegocio } from '../utils/estadoNegocio.js';
import {
  calcularFiabilidad,
  camposPublicos,
  claveSala,
  consolidarCampos,
  fusionarConExistente,
  idDeSala,
  motivoExclusion,
  senalesDeLeads,
  siguienteVerificadaEn,
  type CamposPublicosSala,
  type LeadParaCatalogo,
  type NivelSala,
} from '../utils/salaCatalogo.js';

export interface SalaGuardada extends CamposPublicosSala {
  id: string;
  nivel: NivelSala;
  puntuacion: number;
  verificada_en: Date | null;
  bandas_con_respuesta: number;
  bandas_con_entrega: number;
  rebotes: number;
  no_contactar: boolean;
  /** Según Google Maps (verificarSalasEnMaps). Ausente en las filas anteriores a la migración. */
  estado_negocio?: EstadoNegocio;
  estado_negocio_en?: Date | null;
  /** De dónde salió la información pública (`osm` = OpenStreetMap). Ausente en las filas anteriores a la migración. */
  fuentes?: string[];
  /** Dónde está. `coordenadas_aprox` = es el punto de la ciudad, no el de la sala. Ausentes en las filas anteriores a la migración. */
  lat?: number | null;
  lon?: number | null;
  coordenadas_aprox?: boolean;
}

/** Lo que el servicio escribe. `no_contactar` no está: es de quien lo marca y la sincronización nunca lo toca. */
export type SalaAGuardar = Omit<SalaGuardada, 'no_contactar' | 'estado_negocio' | 'estado_negocio_en' | 'lat' | 'lon' | 'coordenadas_aprox'>;

/** Dos claves que son la misma sala (`catalogo_sala_alias`): lo que cae en `aliasClave` va a `clave`. */
export interface AliasSala {
  aliasClave: string;
  clave: string;
  /** Nombre público de la sala resultante; la moda de los leads puede quedarse con una errata. */
  nombre: string | null;
}

export interface PuertoCatalogo {
  leerLeads(): Promise<LeadParaCatalogo[]>;
  leerAlias(): Promise<AliasSala[]>;
  leerSalas(): Promise<SalaGuardada[]>;
  guardarSalas(salas: SalaAGuardar[]): Promise<void>;
  enlazarLeads(enlaces: Array<{ leadId: string; salaId: string }>): Promise<void>;
}

/** Escribe solo las coordenadas: la sincronización no las toca, así que no se pisan entre sí. */
export interface PuertoCoordenadas {
  guardarCoordenadas(filas: FilaCoordenadas[]): Promise<void>;
}

export interface FilaCoordenadas {
  salaId: string;
  lat: number;
  lon: number;
  aprox: boolean;
}

export interface InformeCatalogo {
  simulacion: boolean;
  leadsLeidos: number;
  /** Leads sin nombre o sin ciudad (y sin place_id): no se pueden identificar y no entran. */
  leadsSinClave: number;
  /** Leads que no son una sala (medios, agencias, bandas amigas...) o son de prueba: no entran. */
  leadsFueraDeCatalogo: { tipo: number; prueba: number };
  salasResultantes: number;
  salasNuevas: number;
  salasActualizadas: number;
  salasSinCambios: number;
  /** Leads que son la misma sala que otro: cuántos se fusionaron. */
  duplicadosFusionados: number;
  leadsEnlazados: number;
  porNivel: Record<NivelSala, number>;
}

const TAMANO_LOTE = 200;

const lotes = <T>(items: T[]): T[][] => Array.from({ length: Math.ceil(items.length / TAMANO_LOTE) }, (_, i) => items.slice(i * TAMANO_LOTE, (i + 1) * TAMANO_LOTE));

const CAMPOS_COMPARADOS: Array<keyof SalaAGuardar> = [
  'clave', 'place_id', 'nombre', 'ciudad', 'region', 'direccion', 'tipo', 'aforo', 'genero', 'website', 'instagram',
  'email_contacto', 'telefono', 'nivel', 'puntuacion', 'bandas_con_respuesta', 'bandas_con_entrega', 'rebotes',
];

const huboCambios = (previa: SalaGuardada, nueva: SalaAGuardar): boolean =>
  CAMPOS_COMPARADOS.some((k) => (previa[k] ?? null) !== (nueva[k] ?? null)) ||
  (previa.verificada_en?.getTime() ?? null) !== (nueva.verificada_en?.getTime() ?? null);

type Miembro = { lead: LeadParaCatalogo; ficha: CamposPublicosSala };

/**
 * Si unos leads de una sala traen `place_id` y otros no, serían dos grupos de la misma sala. Los sin `place_id` pasan al
 * grupo con `place_id` cuando su nombre y ciudad coinciden con los de uno solo (con varios candidatos no se adivina).
 */
function unirGruposDeLaMismaSala(grupos: Map<string, Miembro[]>): void {
  const placePorNombreCiudad = new Map<string, string[]>();
  for (const [clave, miembros] of grupos) {
    if (!clave.startsWith('place:')) continue;
    for (const { ficha } of miembros) {
      const nc = claveSala({ nombre: ficha.nombre, ciudad: ficha.ciudad });
      if (nc && !placePorNombreCiudad.get(nc)?.includes(clave)) placePorNombreCiudad.set(nc, [...(placePorNombreCiudad.get(nc) ?? []), clave]);
    }
  }
  for (const [clave, miembros] of [...grupos]) {
    const candidatos = clave.startsWith('nc:') ? placePorNombreCiudad.get(clave) : undefined;
    if (candidatos?.length !== 1) continue;
    grupos.get(candidatos[0])?.push(...miembros);
    grupos.delete(clave);
  }
}

/** Lleva a cada grupo con alias a su sala canónica, aunque la canónica aún no tenga leads. Devuelve el nombre público fijado por clave. */
function aplicarAlias(grupos: Map<string, Miembro[]>, alias: AliasSala[]): Map<string, string> {
  const nombres = new Map<string, string>();
  for (const { aliasClave, clave, nombre } of alias) {
    if (nombre) nombres.set(clave, nombre);
    const miembros = aliasClave === clave ? undefined : grupos.get(aliasClave);
    if (!miembros) continue;
    grupos.set(clave, [...(grupos.get(clave) ?? []), ...miembros]);
    grupos.delete(aliasClave);
  }
  return nombres;
}

export async function sincronizarCatalogo(
  puerto: PuertoCatalogo,
  opciones: { ahora?: Date; simulacion?: boolean; interaccionesDesde?: Date } = {},
): Promise<InformeCatalogo> {
  const ahora = opciones.ahora ?? new Date();
  const simulacion = opciones.simulacion ?? false;

  const [leads, guardadas, alias] = await Promise.all([puerto.leerLeads(), puerto.leerSalas(), puerto.leerAlias()]);
  const porClave = new Map(guardadas.map((s) => [s.clave, s]));

  const grupos = new Map<string, Miembro[]>();
  const excluidos = { tipo: 0, prueba: 0, sin_clave: 0 };
  for (const lead of leads) {
    const motivo = motivoExclusion(lead);
    const ficha = motivo ? null : camposPublicos(lead);
    if (!ficha) {
      excluidos[motivo ?? 'sin_clave']++;
      continue;
    }
    const grupo = grupos.get(ficha.clave) ?? [];
    grupo.push({ lead, ficha });
    grupos.set(ficha.clave, grupo);
  }

  const nombresFijados = aplicarAlias(grupos, alias);
  unirGruposDeLaMismaSala(grupos);

  const aGuardar: SalaAGuardar[] = [];
  const enlaces: Array<{ leadId: string; salaId: string }> = [];
  const porNivel: Record<NivelSala, number> = { sin_verificar: 0, probable: 0, verificada: 0 };
  let nuevas = 0;
  let actualizadas = 0;
  let sinCambios = 0;

  for (const [clave, miembros] of grupos) {
    const consolidada = { ...consolidarCampos(miembros.map((m) => m.ficha)), clave };
    const nombreFijado = nombresFijados.get(clave);
    if (nombreFijado) consolidada.nombre = nombreFijado;
    // Una sala que antes se catalogó por nombre y ciudad y ahora tiene place_id conserva su fila (y su id).
    const claveNombreCiudad = claveSala({ nombre: consolidada.nombre, ciudad: consolidada.ciudad });
    const previa = porClave.get(clave) ?? (consolidada.place_id && claveNombreCiudad ? porClave.get(claveNombreCiudad) : undefined);

    const campos = previa ? fusionarConExistente(previa, { ...consolidada, clave }) : consolidada;
    const senales = senalesDeLeads(miembros.map((m) => m.lead), ahora, campos, previa?.verificada_en, opciones.interaccionesDesde);
    const { puntuacion, nivel } = calcularFiabilidad(senales, ahora);
    const sala: SalaAGuardar = {
      ...campos,
      id: previa?.id ?? idDeSala(clave),
      nivel,
      puntuacion,
      verificada_en: siguienteVerificadaEn(
        previa ? { verificadaEn: previa.verificada_en, bandasConEntrega: previa.bandas_con_entrega, bandasConRespuesta: previa.bandas_con_respuesta } : null,
        senales,
        nivel,
        ahora,
      ),
      bandas_con_respuesta: senales.bandasConRespuesta,
      bandas_con_entrega: senales.bandasConEntrega,
      rebotes: senales.rebotes,
    };

    porNivel[nivel]++;
    if (!previa) {
      nuevas++;
      aGuardar.push(sala);
    } else if (huboCambios(previa, sala)) {
      actualizadas++;
      aGuardar.push(sala);
    } else {
      sinCambios++;
    }
    for (const { lead } of miembros) if (lead.sala_id !== sala.id) enlaces.push({ leadId: lead.id, salaId: sala.id });
  }

  if (!simulacion) {
    // Primero las salas (los leads apuntan a ellas con una FK) y después los enlaces.
    for (const lote of lotes(aGuardar)) await puerto.guardarSalas(lote);
    for (const lote of lotes(enlaces)) await puerto.enlazarLeads(lote);
  }

  return {
    simulacion,
    leadsLeidos: leads.length,
    leadsSinClave: excluidos.sin_clave,
    leadsFueraDeCatalogo: { tipo: excluidos.tipo, prueba: excluidos.prueba },
    salasResultantes: grupos.size,
    salasNuevas: nuevas,
    salasActualizadas: actualizadas,
    salasSinCambios: sinCambios,
    duplicadosFusionados: leads.length - excluidos.tipo - excluidos.prueba - excluidos.sin_clave - grupos.size,
    leadsEnlazados: enlaces.length,
    porNivel,
  };
}
