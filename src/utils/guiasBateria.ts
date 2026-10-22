import type { AnalisisArmonico } from './teoriaArmonica';
import type { GuiaProfesor } from './guiasArmonia';

/**
 * Consejos para el batería SIN IA. A quien toca la batería la tonalidad le da igual: lo que le sirve
 * es el pulso, cuánto tarda en cambiar la canción, dónde caen los cambios (ahí van los fills) y
 * qué golpes cuadran con ese tempo. Los «dato» salen del análisis; los «idea» son oficio, marcados.
 */
export interface OpcionesBateria {
  bpm?: number;
  tiemposPorCompas?: 3 | 4;
  /** Bloques de la cuadrícula (A, B…) si se han podido deducir. */
  bloques?: number;
}

/** Cómo se siente el tempo y qué subdivisión conviene en el charles. */
function tempo(bpm: number): { titulo: string; texto: string } {
  if (bpm < 80) return { titulo: 'Tempo lento', texto: `A ${bpm} BPM hay mucho aire: subdivide el charles a semicorcheas o toca a medio tiempo (caja en el 3) para que no se caiga el pulso.` };
  if (bpm < 110) return { titulo: 'Tempo medio', texto: `A ${bpm} BPM el charles a corcheas es lo natural. Es el tempo ideal para un groove con notas fantasma en la caja.` };
  if (bpm < 140) return { titulo: 'Tempo de rock', texto: `A ${bpm} BPM manda el 2 y el 4 en la caja con el charles a corcheas. Aguanta el tempo desde el bombo: que no se acelere en los estribillos.` };
  return { titulo: 'Tempo rápido', texto: `A ${bpm} BPM ahorra fuerza: charles o ride a negras en vez de corcheas y no muevas más el brazo de lo necesario. Un metrónomo en el monitor te evita acelerar.` };
}

export function guiasBateria(a: AnalisisArmonico, o: OpcionesBateria = {}): GuiaProfesor[] {
  const guias: GuiaProfesor[] = [];
  const tiempos = o.tiemposPorCompas ?? 4;

  if (o.bpm) {
    const t = tempo(Math.round(o.bpm));
    guias.push({ id: 'bat-tempo', titulo: t.titulo, texto: t.texto, tipo: 'dato' });
  }
  if (tiempos === 3) {
    guias.push({ id: 'bat-compas', titulo: 'Compás de 3 tiempos', texto: 'Es un 3/4 (o un 6/8 sentido a dos): cuenta en tres y acentúa el 1 con bombo y crash; la caja suele ir en el 3.', tipo: 'dato' });
  }

  // Cada cuántos compases cambia el acorde: ahí caen los fills y los cambios de golpe.
  if (o.bpm && a.cambiosPorMinuto > 0) {
    const segundosCompas = (tiempos * 60) / o.bpm;
    const compasesPorCambio = 60 / a.cambiosPorMinuto / segundosCompas;
    const redondo = Math.max(1, Math.round(compasesPorCambio));
    guias.push({
      id: 'bat-cambios',
      titulo: 'Cuándo cambia la canción',
      texto: compasesPorCambio < 0.75
        ? 'La armonía cambia varias veces por compás: no persigas cada cambio. Mantén el groove firme y marca solo los cambios que caen en el 1.'
        : `El acorde cambia cada ${redondo === 1 ? 'compás' : `${redondo} compases`} más o menos. Guarda el fill para el último compás de cada frase (de 4 u 8) y entra con un crash en el 1 del siguiente.`,
      tipo: 'dato',
    });
  }

  if (a.bucle) {
    guias.push({
      id: 'bat-bucle',
      titulo: 'Una frase que se repite',
      texto: `La progresión se repite ${a.bucle.veces} veces: es la frase de la canción. Marca su inicio con el mismo golpe cada vuelta y cambia el dibujo (no el pulso) cuando suba la energía.`,
      tipo: 'dato',
    });
  }
  if (o.bloques && o.bloques > 1) {
    guias.push({ id: 'bat-bloques', titulo: 'Secciones', texto: `Hay ${o.bloques} bloques distintos. Dale a cada uno su propio groove: así el oyente nota el cambio de sección aunque la guitarra no se mueva.`, tipo: 'dato' });
  }

  guias.push(
    { id: 'bat-dinamica', titulo: 'Dinámica entre secciones', texto: 'Verso con charles cerrado y caja suave; estribillo con charles abierto o ride y caja más fuerte. El salto de volumen vende más que cualquier fill.', tipo: 'idea' },
    { id: 'bat-fantasma', titulo: 'Notas fantasma', texto: 'Prueba a meter notas fantasma muy suaves en la caja entre los golpes fuertes (la «e» y la «a» del 2 y del 4): dan un groove vivo sin tocar más fuerte.', tipo: 'idea' },
    { id: 'bat-aro', titulo: 'Golpe de aro', texto: 'En un tramo tranquilo cambia la caja por el golpe de aro (cross-stick) o un rimshot en el estribillo: cambia el color sin cambiar el ritmo.', tipo: 'idea' },
    { id: 'bat-fill', titulo: 'Fill sencillo', texto: 'Un fill de corcheas bajando de la caja a los toms, rematado con crash y bombo en el 1, funciona casi siempre. Si dudas, deja el compás vacío y entra fuerte: un silencio también es un fill.', tipo: 'idea' },
  );
  return guias;
}
