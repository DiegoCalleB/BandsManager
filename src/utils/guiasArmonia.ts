import { escalasSugeridas, notasDelAcorde, simplificarGrado, type AnalisisArmonico, type ModoId, type Funcion } from './teoriaArmonica';

/**
 * Consejos del «profesor» generados SIN IA, a partir de los hechos del análisis. Cada guía es un
 * dato musical comprobable (escala del modo, notas guía de un cambio, acordes prestados…) o una
 * idea de arreglo claramente marcada como tal. Los nombres de nota van como `{n:PC}` para que la
 * pantalla los escriba en español o inglés y respetando la transposición.
 */
export interface GuiaProfesor {
  id: string;
  titulo: string;
  texto: string;
  /** «dato»: sale del análisis. «idea»: sugerencia de arreglo (opinable). */
  tipo: 'dato' | 'idea';
}

const N = (pc: number) => `{n:${((pc % 12) + 12) % 12}}`;

const ESCALA_BASE: Record<ModoId, (t: number) => string> = {
  jonico: (t) => `Toda la canción cabe en la escala mayor de ${N(t)}. Para improvisar con seguridad, usa la pentatónica mayor de ${N(t)}; cuando quieras más color, añade la 4.ª y la 7.ª de la escala mayor.`,
  mixolidio: (t) => `Es mixolidio de ${N(t)}: la escala mayor con la 7.ª menor (${N(t + 10)}). Para sonar a blues-rock, mezcla la pentatónica menor de ${N(t)} con la 3.ª mayor (${N(t + 4)}): la 3.ª menor (${N(t + 3)}) sobre un acorde mayor es la «nota azul».`,
  lidio: (t) => `Es lidio de ${N(t)}: la escala mayor con la 4.ª aumentada (${N(t + 6)}), que le da su sonido flotante. Apóyate en esa nota sobre el acorde de tónica.`,
  eolico: (t) => `Es menor natural de ${N(t)}. La pentatónica menor de ${N(t)} funciona sobre casi todo; para más tensión, usa la 7.ª mayor (${N(t + 11)}) sobre el acorde dominante si lo hay.`,
  dorico: (t) => `Es dórico de ${N(t)}: menor con la 6.ª mayor (${N(t + 9)}), que le da luz. Esa 6.ª es la nota que lo distingue del menor natural: úsala sobre el acorde de tónica.`,
  frigio: (t) => `Es frigio de ${N(t)}: menor con la 2.ª menor (${N(t + 1)}), el sonido flamenco y de metal. Apóyate en esa 2.ª para sonar «a propósito».`,
};

export function guiasDelProfesor(a: AnalisisArmonico, opciones: { yaModula?: boolean; grados?: 'simple' | 'completo' } = {}): GuiaProfesor[] {
  const G = (g: string) => (opciones.grados === 'completo' ? g : simplificarGrado(g));
  const guias: GuiaProfesor[] = [];
  const t = a.tonalidad.tonica;

  guias.push({ id: 'escala-base', titulo: 'La escala de la canción', texto: ESCALA_BASE[a.modo.id](t), tipo: 'dato' });

  // Notas guía en los cambios del bucle: la 3.ª del acorde al que se llega es la nota que mejor marca el cambio.
  if (a.bucle) {
    const grados = a.bucle.grados;
    const porGrado = new Map(a.acordes.map((r) => [r.grado, r]));
    const cambios: string[] = [];
    for (let i = 0; i < Math.min(grados.length, 4); i++) {
      const hacia = porGrado.get(grados[(i + 1) % grados.length]);
      const desde = porGrado.get(grados[i]);
      const n = hacia ? notasDelAcorde(hacia.acorde, hacia.funcion) : null;
      if (hacia && desde && n && n.tercera !== null && desde.acorde !== hacia.acorde) {
        cambios.push(`de ${desde.acorde} a ${hacia.acorde}, ${N(n.tercera)} (su 3.ª)`);
      }
    }
    if (cambios.length) {
      guias.push({
        id: 'notas-guia',
        titulo: 'Notas guía en los cambios',
        texto: `La nota que mejor «dibuja» cada cambio es la 3.ª del acorde al que llegas: ${cambios.join('; ')}. Si improvisas y aterrizas ahí en el primer tiempo del compás, suenas a propósito.`,
        tipo: 'dato',
      });
    }
  }

  // Acordes prestados (color modal).
  const prestados = a.acordes.filter((r) => r.funcion === 'M').slice(0, 2);
  for (const r of prestados) {
    const esc = escalasSugeridas(r.acorde, a.tonalidad, a.modo.id)[0];
    guias.push({
      id: `prestado-${r.acorde}`,
      titulo: `${r.acorde} (${G(r.grado)}) es un acorde de color`,
      texto: `No es de la escala mayor de la tonalidad: viene de otro modo y por eso suena «distinto». Sobre él, toca ${esc ? esc.nombre.replace('{R}', N(esc.raiz)) : 'su propia escala'}; si dudas, la pentatónica de ${N(esc?.raiz ?? t)} es seguro.`,
      tipo: 'dato',
    });
  }

  // Dominantes (tensión).
  const dominante = a.acordes.find((r) => r.funcion === 'D');
  if (dominante) {
    guias.push({
      id: 'dominante',
      titulo: `La tensión está en ${dominante.acorde}`,
      texto: `Es el acorde dominante (${G(dominante.grado)}${dominante.secundario ? `, ${G(dominante.secundario)}` : ''}): pide volver a casa. Es el mejor sitio para notas de tensión (su 7.ª) y para resolver después en la tónica.`,
      tipo: 'dato',
    });
  }

  // Componer: bajo y riffs.
  guias.push({
    id: 'componer',
    titulo: 'Para componer líneas de bajo y riffs',
    texto: `Bajo: la raíz de cada acorde en el primer tiempo y, para moverte, su 5.ª o la nota de paso hacia el siguiente. Riff: constrúyelo sobre la pentatónica de ${N(t)} y cambia a las notas guía de cada acorde cuando cambie la armonía.`,
    tipo: 'dato',
  });

  // Ideas de dinamismo (opinables, etiquetadas como ideas).
  const f: Record<Funcion, number> = a.funciones;
  if (!opciones.yaModula) {
    guias.push({
      id: 'idea-subir-tono',
      titulo: 'Subir un tono en el último estribillo',
      texto: `Repite el último bloque medio tono o un tono más arriba (${N(t + 1)} o ${N(t + 2)} como nueva tónica): es el recurso clásico para dar un empujón final sin cambiar nada más.`,
      tipo: 'idea',
    });
  }
  guias.push({
    id: 'idea-pedal',
    titulo: 'Pedal en la tónica',
    texto: `En un verso, deja el bajo fijo en ${N(t)} mientras los acordes de arriba cambian: crea tensión sin tocar la armonía y hace más grande la entrada del estribillo.`,
    tipo: 'idea',
  });
  if (f.D < 0.05) {
    guias.push({
      id: 'idea-dominante',
      titulo: 'Un dominante antes del estribillo',
      texto: `La canción casi no usa el dominante (${N(t + 7)}). Un solo compás de ${N(t + 7)} justo antes del estribillo crea la necesidad de «volver a casa» y hace que la tónica suene a llegada.`,
      tipo: 'idea',
    });
  }
  guias.push({
    id: 'idea-contraste',
    titulo: 'Contraste entre bloques',
    texto: 'Cambia la textura, no los acordes: arpegia el verso y rasguea abierto el estribillo, o quita la batería en el primer bucle y mete las capas poco a poco.',
    tipo: 'idea',
  });
  return guias;
}
