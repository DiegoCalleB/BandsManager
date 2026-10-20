/**
 * Importación al catálogo de las fichas de una fuente externa (Wikidata, directorios…), con las mismas reglas para todas:
 *
 * - Solo AÑADE: una sala que ya está no se pisa; únicamente se le rellenan los campos vacíos. Una verificada no se toca.
 * - Las nuevas entran «sin verificar»: la fiabilidad la dan las bandas y las comprobaciones, no la fuente.
 * - La procedencia queda anotada en `fuentes`, para citarla y para decidir dónde se puede mostrar.
 * - El punto en el mapa de la fuente se guarda en las salas que no tienen uno exacto.
 *
 * Depende de un puerto, no de Supabase ni de la red: se prueba con datos en memoria.
 */
import { completarSala } from '../utils/osmSalas.js';
import { calcularFiabilidad, idDeSala, type CamposPublicosSala } from '../utils/salaCatalogo.js';
import type { FilaCoordenadas, PuertoCatalogo, PuertoCoordenadas, SalaAGuardar, SalaGuardada } from './catalogoSalas.js';

export type PuertoFuente = Pick<PuertoCatalogo, 'leerSalas' | 'guardarSalas' | 'leerAlias'> & Partial<PuertoCoordenadas>;

export interface FichaDeFuente {
  campos: CamposPublicosSala;
  punto?: { lat: number; lon: number } | null;
}

export interface InformeFuente {
  simulacion: boolean;
  fichas: number;
  nuevas: number;
  completadas: number;
  sinCambios: number;
  conCoordenadas: number;
  /** Unos pocos nombres de las nuevas, para comprobar a ojo en el log que la fuente trae lo que debe. */
  ejemplos: string[];
}

const TAMANO_LOTE = 200;
const CAMPOS: Array<keyof CamposPublicosSala> = ['place_id', 'nombre', 'ciudad', 'region', 'direccion', 'tipo', 'aforo', 'genero', 'website', 'instagram', 'email_contacto', 'telefono'];

const fichaDe = (s: SalaGuardada): CamposPublicosSala => ({ clave: s.clave, ...(Object.fromEntries(CAMPOS.map((c) => [c, s[c]])) as Omit<CamposPublicosSala, 'clave'>) });

export async function importarDeFuente(p: { puerto: PuertoFuente; fuente: string; fichas: readonly FichaDeFuente[]; simulacion?: boolean; ahora?: () => Date }): Promise<InformeFuente> {
  const ahora = (p.ahora ?? (() => new Date()))();
  const alias = new Map((await p.puerto.leerAlias()).map((a) => [a.aliasClave, a.clave]));
  const porClave = new Map<string, FichaDeFuente>();
  for (const f of p.fichas) {
    const clave = alias.get(f.campos.clave) ?? f.campos.clave;
    const previa = porClave.get(clave);
    porClave.set(clave, previa ? { campos: completarSala(previa.campos, f.campos), punto: previa.punto ?? f.punto } : { campos: { ...f.campos, clave }, punto: f.punto });
  }
  const existentes = new Map((await p.puerto.leerSalas()).map((s) => [s.clave, s]));

  const aGuardar: SalaAGuardar[] = [];
  const coordenadas: FilaCoordenadas[] = [];
  const informe: InformeFuente = { simulacion: !!p.simulacion, fichas: porClave.size, nuevas: 0, completadas: 0, sinCambios: 0, conCoordenadas: 0, ejemplos: [] };

  for (const { campos: c, punto } of porClave.values()) {
    const previa = existentes.get(c.clave);
    const salaId = previa?.id ?? idDeSala(c.clave);
    if (punto && !(previa && previa.lat != null && !previa.coordenadas_aprox)) coordenadas.push({ salaId, ...punto, aprox: false });

    if (!previa) {
      const { puntuacion, nivel } = calcularFiabilidad({ placeId: false, webDeclarada: !!c.website, emailValido: !!c.email_contacto, bandasConEntrega: 0, bandasConRespuesta: 0, rebotes: 0 }, ahora);
      aGuardar.push({ ...c, id: salaId, nivel, puntuacion, verificada_en: null, bandas_con_respuesta: 0, bandas_con_entrega: 0, rebotes: 0, fuentes: [p.fuente] });
      informe.nuevas++;
      if (informe.ejemplos.length < 5) informe.ejemplos.push(`${c.nombre} (${c.ciudad ?? '?'})`);
      continue;
    }
    const completa = completarSala(fichaDe(previa), c);
    if (previa.nivel === 'verificada' || CAMPOS.every((k) => (completa[k] ?? null) === (previa[k] ?? null))) {
      informe.sinCambios++;
      continue;
    }
    const { clave: _clave, ...resto } = completa;
    const { no_contactar: _nc, estado_negocio: _en, estado_negocio_en: _ene, ...base } = previa;
    aGuardar.push({ ...base, ...resto, fuentes: [...new Set([...(previa.fuentes ?? []), p.fuente])] });
    informe.completadas++;
  }
  informe.conCoordenadas = coordenadas.length;

  if (!p.simulacion) {
    for (let i = 0; i < aGuardar.length; i += TAMANO_LOTE) await p.puerto.guardarSalas(aGuardar.slice(i, i + TAMANO_LOTE));
    // Después de guardar: las salas nuevas tienen que existir para poder ponerles el punto.
    await p.puerto.guardarCoordenadas?.(coordenadas);
  }
  return informe;
}
