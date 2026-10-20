/**
 * Carga inicial al catálogo de las salas de Bandflow (bandflow.es), a partir de una semilla ya extraída y filtrada
 * (server/data/bandflowSalas.ts, generada con scripts/bandflow-semilla.ts). Sin red: la semilla viaja con el código.
 *
 * Solo AÑADE, igual que la importación de OSM: una sala que ya está en el catálogo no se pisa, únicamente se le rellenan los
 * campos vacíos, y nunca se toca una verificada. Las nuevas entran «sin verificar»: la fiabilidad la dan las bandas y las
 * comprobaciones, no el directorio de origen. Su procedencia (`bandflow`) queda anotada y esas salas no se publican en el
 * directorio público de BandManager: se usan solo dentro de la aplicación.
 */
import { SALAS_BANDFLOW } from '../data/bandflowSalas.js';
import { completarSala } from '../utils/osmSalas.js';
import { calcularFiabilidad, idDeSala, type CamposPublicosSala } from '../utils/salaCatalogo.js';
import type { PuertoCatalogo, SalaAGuardar, SalaGuardada } from './catalogoSalas.js';

export const FUENTE_BANDFLOW = 'bandflow';

export type PuertoSemilla = Pick<PuertoCatalogo, 'leerSalas' | 'guardarSalas' | 'leerAlias'>;

export interface InformeSemilla {
  simulacion: boolean;
  salasEnSemilla: number;
  nuevas: number;
  completadas: number;
  sinCambios: number;
}

const TAMANO_LOTE = 200;
const CAMPOS: Array<keyof CamposPublicosSala> = ['place_id', 'nombre', 'ciudad', 'region', 'direccion', 'tipo', 'aforo', 'genero', 'website', 'instagram', 'email_contacto', 'telefono'];

const fichaDe = (s: SalaGuardada): CamposPublicosSala => ({ clave: s.clave, ...(Object.fromEntries(CAMPOS.map((c) => [c, s[c]])) as Omit<CamposPublicosSala, 'clave'>) });

function nuevaSala(c: CamposPublicosSala, ahora: Date): SalaAGuardar {
  const { puntuacion, nivel } = calcularFiabilidad({ placeId: false, webDeclarada: !!c.website, emailValido: !!c.email_contacto, bandasConEntrega: 0, bandasConRespuesta: 0, rebotes: 0 }, ahora);
  return { ...c, id: idDeSala(c.clave), nivel, puntuacion, verificada_en: null, bandas_con_respuesta: 0, bandas_con_entrega: 0, rebotes: 0, fuentes: [FUENTE_BANDFLOW] };
}

export async function importarSalasDeBandflow(p: { puerto: PuertoSemilla; salas?: readonly CamposPublicosSala[]; simulacion?: boolean; ahora?: () => Date }): Promise<InformeSemilla> {
  const ahora = (p.ahora ?? (() => new Date()))();
  const alias = new Map((await p.puerto.leerAlias()).map((a) => [a.aliasClave, a.clave]));
  const porClave = new Map<string, CamposPublicosSala>();
  for (const c of p.salas ?? SALAS_BANDFLOW) {
    const clave = alias.get(c.clave) ?? c.clave;
    const previa = porClave.get(clave);
    porClave.set(clave, previa ? completarSala(previa, c) : { ...c, clave });
  }
  const existentes = new Map((await p.puerto.leerSalas()).map((s) => [s.clave, s]));

  const aGuardar: SalaAGuardar[] = [];
  const informe: InformeSemilla = { simulacion: !!p.simulacion, salasEnSemilla: porClave.size, nuevas: 0, completadas: 0, sinCambios: 0 };

  for (const c of porClave.values()) {
    const previa = existentes.get(c.clave);
    if (!previa) {
      aGuardar.push(nuevaSala(c, ahora));
      informe.nuevas++;
      continue;
    }
    const completa = completarSala(fichaDe(previa), c);
    const aportaAlgo = !CAMPOS.every((k) => (completa[k] ?? null) === (previa[k] ?? null));
    // Una sala verificada no se toca; en el resto solo se rellenan huecos.
    if (previa.nivel === 'verificada' || !aportaAlgo) {
      informe.sinCambios++;
      continue;
    }
    const { clave: _clave, ...campos } = completa;
    const { no_contactar: _nc, estado_negocio: _en, estado_negocio_en: _ene, ...base } = previa;
    aGuardar.push({ ...base, ...campos, fuentes: [...new Set([...(previa.fuentes ?? []), FUENTE_BANDFLOW])] });
    informe.completadas++;
  }

  if (!p.simulacion) for (let i = 0; i < aGuardar.length; i += TAMANO_LOTE) await p.puerto.guardarSalas(aGuardar.slice(i, i + TAMANO_LOTE));
  return informe;
}
