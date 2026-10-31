// Asesor de Marketing: los números de una pieza en TikTok y YouTube Shorts. Instagram tiene su camino
// propio (`registrarResultado`, con los umbrales del temario); aquí cada red mide lo suyo y la lectura
// compara con lo habitual de la propia banda en esa red. El formato y el título salen de la acción
// «hecho» guardada, nunca del cliente; sin esa acción no se anota nada.

import { dbAccionesDesde, dbGetEstrategiaMarketing, dbGuardarResultadoRed, dbResultadosRedDesde } from '../db/asesorMarketing.js';
import { hoyIso } from '../utils/paginaConcierto.js';
import { sumarDias } from '../../src/utils/campanaConcierto.js';
import { DIAS_APRENDIZAJE } from '../../src/utils/asesor/opciones.js';
import { ESTRATEGIA_INICIAL } from '../../src/utils/asesor/estrategia.js';
import { lecturaRelativa, previasDe, REDES_EXTRA, sanearMetricasRed, type RedExtra } from '../../src/utils/asesor/metricasPorRed.js';
import { tituloDe } from '../../src/utils/asesor/resumen.js';

const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

export type ResultadoMedidaRed =
  | { estado: 'ok'; titulo: string; veredicto: string; mensaje: string }
  | { estado: 'no_existe' }
  | { estado: 'sin_bd' }
  | { estado: 'invalido'; motivo: string };

export async function registrarResultadoRed(
  bandId: string,
  datos: { fecha?: unknown; tarjetaId?: unknown; red?: unknown } & Record<string, unknown>,
  ahora = new Date(),
): Promise<ResultadoMedidaRed> {
  if (typeof datos.red !== 'string' || !REDES_EXTRA.includes(datos.red as RedExtra)) return { estado: 'invalido', motivo: 'Esa red no es válida.' };
  const red = datos.red as RedExtra;
  const metricas = sanearMetricasRed(red, datos);
  if (typeof metricas === 'string') return { estado: 'invalido', motivo: metricas };
  if (typeof datos.fecha !== 'string' || !FECHA_ISO.test(datos.fecha) || typeof datos.tarjetaId !== 'string') return { estado: 'no_existe' };

  const estrategia = await dbGetEstrategiaMarketing(bandId);
  if (estrategia === undefined) return { estado: 'sin_bd' };
  if (!(estrategia ?? ESTRATEGIA_INICIAL).redes.includes(red)) return { estado: 'invalido', motivo: 'Esa red no está en vuestra estrategia. Añadidla en la pestaña Estrategia.' };

  const hoy = hoyIso(ahora);
  const desde = sumarDias(hoy, -DIAS_APRENDIZAJE);
  const acciones = await dbAccionesDesde(bandId, desde);
  const hecha = acciones.find((a) => a.accion === 'hecho' && a.fecha === datos.fecha && a.tarjetaId === datos.tarjetaId);
  if (!hecha) return { estado: 'no_existe' };
  // Solo un vídeo vertical se publica igual en las tres redes; un carrusel o unas stories son de Instagram.
  if (hecha.formato !== 'reel') return { estado: 'invalido', motivo: 'Solo los vídeos salen en esta red.' };

  const titulo = tituloDe(hecha);
  const previas = previasDe(await dbResultadosRedDesde(bandId, desde), { fecha: hecha.fecha, tarjetaId: hecha.tarjetaId, red }, hoy);
  if (!(await dbGuardarResultadoRed(bandId, { fecha: hecha.fecha, tarjetaId: hecha.tarjetaId, red, formato: hecha.formato, titulo, metricas }))) return { estado: 'sin_bd' };
  const lectura = lecturaRelativa(red, metricas, previas);
  return { estado: 'ok', titulo, veredicto: lectura.estado, mensaje: lectura.mensaje };
}
