// Set de prueba calcado de un setlist real (Ruta 66, 25 temas) con TODO lo que ensucia una hoja
// impresa: tono y BPM, un título larguísimo, notas por músico, notas del bolo, la nota
// autogenerada "Versión Original" en casi todos los temas, historial de edición pegado a una
// nota, interludios y un nombre de setlist con el paréntesis repetido.
// Se inyecta interceptando /api/songs y /api/setlists, sin tocar los datos de la app.

const BAND_ID = 'band-bakandeya';

const TEMAS: [string, string, number][] = [
  ['Bienvenidos', 'E', 132], ['Born to be wild', 'E', 146], ['Some kind of wonderful', 'D', 105],
  ['Whole lotta love', 'E', 89], ['Going down', 'D', 104], ['Long train runnin', 'G', 118],
  ['Crossroads', 'G', 138], ['Me has cazado (You really got me)', 'A', 138],
  ['Have you ever seen the rain', 'C', 116], ['Al right now', 'A', 120],
  ["We're an american band", 'D', 118], ['Gimme some lovin', 'G', 148], ["Can't you see", 'D', 140],
  ['Proud Mary', 'D', 121], ['Whatever you want', 'D', 132], ["Let's stick together", 'A', 124],
  ['Radar love', 'F#m', 100], ['Knocking in heavens', 'G', 68],
  ['The house of the rising son // A whiter shade of pale', 'Am', 76], ['Dream on', 'Fm', 80],
  ['Blac betty', 'B', 116], ['Walking by myself', 'Bm', 138], ['Roadhouse blues', 'E', 118],
  ['La grange', 'A', 162], ["Baba O'reilei", 'F', 118],
];

// Notas del bolo por índice de tema (una lleva el historial de edición pegado).
const NOTAS_BOLO: Record<number, string> = {
  3: 'nota grupo nueva',
  6: 'Cuidadín con el final',
  8: 'Nota del grupo nueva 15:56 EDITADA 2 veces',
  13: 'PRESENTACIÓN DE LA BANDA!',
};

// Notas por músico (clave = nombre del miembro por defecto, ver resolveBandMembers).
const NOTAS_MIEMBRO: Record<number, Record<string, string>> = {
  6: { 'Voz / Guitarra': 'En A' },
  13: { 'Voz / Guitarra': 'Ojo con el corte!' },
};

export const RUTA66_NOMBRE = 'RUTA 66. “Classic” 2026 (Setlist Perfecto) (Setlist Perfecto)';

export const RUTA66_SONGS = TEMAS.map(([titulo, tonalidad, bpm], i) => ({
  id: `r66-${i}`,
  band_id: BAND_ID,
  titulo,
  duracion: '3:30',
  duracionSegundos: 210,
  tonalidad,
  bpm,
  afinacion: 'E Standard',
  albumDisco: 'Classic',
  estadoTema: 'listo',
  esVersionCovers: true,
  notasRepertorio: `[Versión Original: Rock Clásico - ${tonalidad}, 120 BPM]`,
  ...(NOTAS_MIEMBRO[i] ? { notasMiembros: NOTAS_MIEMBRO[i] } : {}),
}));

export const RUTA66_SETLIST = {
  id: 'r66-setlist',
  band_id: BAND_ID,
  nombre: RUTA66_NOMBRE,
  descripcion: 'Fixture de maquetación',
  tipoFormato: 'concierto',
  duracionTotalEstimadaMinutos: 90,
  fechaCreacion: '2026-10-01',
  fechaUltimaEdicion: '2026-10-01',
  items: TEMAS.flatMap((_, i) => {
    const fila: Record<string, unknown>[] = [
      { id: `r66i-${i}`, songId: `r66-${i}`, tipoItem: 'cancion', ...(NOTAS_BOLO[i] ? { notaTema: NOTAS_BOLO[i] } : {}) },
    ];
    if (i === 5) fila.push({ id: 'r66c-1', tipoItem: 'bloque', bloqueSubtipo: 'chapa', tituloCustom: 'CHAPA / DISCURSO CON PÚBLICO' });
    if (i === 14) fila.push({ id: 'r66b-2', tipoItem: 'bloque', bloqueSubtipo: 'header', tituloCustom: 'Segundo bloque' });
    if (i === 21) fila.push({ id: 'r66c-2', tipoItem: 'bloque', bloqueSubtipo: 'chapa', tituloCustom: 'PRESENTACIÓN BANDA & SALUDO' });
    return fila;
  }),
};
