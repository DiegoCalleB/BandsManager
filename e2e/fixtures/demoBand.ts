/**
 * Banda de DEMO para la landing pública y las capturas. Todo ficticio salvo el nombre y el logo de la banda de
 * la plataforma (Bakandeya). Los retratos son ILUSTRACIONES generadas por scripts/landing/generar-demo-assets.mjs:
 * para usar fotos reales, sustituye los ficheros de public/landing/demo/ y cambia aquí las rutas.
 */
import fs from 'node:fs';

/** Foto real si existe (scripts/landing/importar_fotos.py); si no, el retrato/escena ilustrado .svg. */
const demoImg = (base: string) => `/landing/demo/${base}.${fs.existsSync(`public/landing/demo/${base}.jpg`) ? 'jpg' : 'svg'}`;

export const BANDA = { id: 'bakandeya', nombre: 'Bakandeya', logo: '/logo_bakandeya.jpg' };

/** Segunda banda de la cuenta de demo: el mánager lleva Bakandeya y Ruta 66 (de ahí «Varias bandas»). Solo eventos ficticios. */
export const RUTA66 = { id: 'ruta66', band_id: 'band-ruta66', nombre: 'Ruta 66' };
export const BANDAS_DISPONIBLES = [
  { band_id: 'band-bakandeya', bandName: 'BAKANDEYA', nombre_banda: 'BAKANDEYA', role: 'leader', userId: 'user-diego', plan: 'de_gira', logoUrl: '/logo_bakandeya.jpg', is_main: true },
  { band_id: RUTA66.band_id, bandName: RUTA66.nombre, nombre_banda: RUTA66.nombre, role: 'leader', userId: 'user-diego', plan: 'cabeza_de_cartel', logoUrl: fs.existsSync('public/landing/demo/logo-ruta66.png') ? '/landing/demo/logo-ruta66.png' : '', is_main: false },
];

export const MIEMBROS = [
  { id: 'm1', nombre: 'Lucía Ferrer', rol: 'Voz y carisma', fotoUrl: demoImg('miembro-lucia'), bio: 'Letras, voz y la que te hace cantar en la tercera fila.', instagram: '@lucia.ferrer' },
  { id: 'm2', nombre: 'Marcos Ibarra', rol: 'Violín solista', fotoUrl: demoImg('miembro-marcos'), bio: 'Formado en conservatorio, desaprendido en los bares.', instagram: '@marcos.violin' },
  { id: 'm3', nombre: 'Nuria Salgado', rol: 'Bajo y coros', fotoUrl: demoImg('miembro-nuria'), bio: 'El suelo firme sobre el que todo salta.', instagram: '@nuria.bajo' },
  { id: 'm4', nombre: 'Dani Quintana', rol: 'Percusión', fotoUrl: demoImg('miembro-dani'), bio: 'Batería, cajón y todo lo que suene al golpearlo.', instagram: '@dani.q' },
  { id: 'm5', nombre: 'Óscar Pardo', rol: 'Sintetizadores', fotoUrl: demoImg('miembro-oscar'), bio: 'Analógico, cables y un ampli que no apaga nunca.', instagram: '@oscar.sintes' },
];

const T = (id: string, titulo: string, dur: string, seg: number, ton: string, bpm: number, en: number, disco: string, n: number) => ({
  id, titulo, duracion: dur, duracionSegundos: seg, tonalidad: ton, bpm, energia: en, albumDisco: disco, ordenAlbum: n, band_id: 'bakandeya', estado: 'listo',
});
export const CANCIONES = [
  T('d1', 'Calle Mayor', '3:42', 222, 'Am', 128, 12, 'Hojalata (2025)', 1),
  T('d2', 'Hojalata', '4:05', 245, 'Em', 138, 15, 'Hojalata (2025)', 2),
  T('d3', 'La Verbena Eléctrica', '3:28', 208, 'Dm', 146, 18, 'Hojalata (2025)', 3),
  T('d4', 'Cuatro Estaciones de Autobús', '4:31', 271, 'G', 112, 9, 'Hojalata (2025)', 4),
  T('d5', 'Pólvora', '3:15', 195, 'Bm', 152, 19, 'Hojalata (2025)', 5),
  T('d6', 'Baile de Mudanzas', '3:50', 230, 'C', 124, 13, 'Ruido Blanco (EP)', 1),
  T('d7', 'Ruido Blanco', '5:02', 302, 'F#m', 96, 7, 'Ruido Blanco (EP)', 2),
  T('d8', 'El Último Tren a Vigo', '4:18', 258, 'Em', 132, 14, 'Ruido Blanco (EP)', 3),
  T('d9', 'Gaita Sintética', '3:36', 216, 'A', 140, 17, 'Single 2026', 1),
  T('d10', 'Bis de Madrugada', '4:44', 284, 'D', 118, 11, 'Single 2026', 2),
];

export const SETLISTS = [
  {
    id: 'sl-demo', nombre: 'Festival Directo 60 min', tipoFormato: 'festival', fechaCreacion: '2026-05-01', fechaUltimaEdicion: '2026-06-10', band_id: 'bakandeya',
    items: [
      { id: 'i1', tipoItem: 'bloque', bloqueSubtipo: 'header', tituloCustom: 'Bloque 1 · Arranque' },
      { id: 'i2', songId: 'd1', tipoItem: 'cancion', notaTema: 'Arrancar con el violín solo' },
      { id: 'i3', songId: 'd2', tipoItem: 'cancion' },
      { id: 'i4', songId: 'd4', tipoItem: 'cancion', notaTema: 'Bajar a media luz' },
      { id: 'i5', tipoItem: 'bloque', bloqueSubtipo: 'presentacion', tituloCustom: 'Presentación de la banda', duracionEstimadaMinutos: 2 },
      { id: 'i6', tipoItem: 'bloque', bloqueSubtipo: 'header', tituloCustom: 'Bloque 2 · Subidón' },
      { id: 'i7', songId: 'd6', tipoItem: 'cancion' },
      { id: 'i8', songId: 'd3', tipoItem: 'cancion', notaTema: 'Palmas del público' },
      { id: 'i9', songId: 'd5', tipoItem: 'cancion' },
      { id: 'i10', songId: 'd9', tipoItem: 'cancion' },
      { id: 'i11', tipoItem: 'bloque', bloqueSubtipo: 'bis', tituloCustom: 'Bis', duracionEstimadaMinutos: 1 },
      { id: 'i12', songId: 'd10', tipoItem: 'cancion' },
    ],
  },
];

const SALAS: [string, string, string, number, string][] = [
  ['Sala Mercurio', 'Madrid', 'Madrid', 450, 'confirmado'],
  ['La Fábrica del Sur', 'Sevilla', 'Andalucía', 600, 'negociando'],
  ['Teatro Bóveda', 'Zaragoza', 'Aragón', 800, 'respondido'],
  ['Café Pleamar', 'Vigo', 'Galicia', 220, 'esperando_respuesta'],
  ['Sala Faro', 'Valencia', 'Comunitat Valenciana', 350, 'esperando_respuesta'],
  ['Garaje Ocho', 'Bilbao', 'País Vasco', 280, 'nuevo'],
  ['El Almacén', 'Granada', 'Andalucía', 400, 'nuevo'],
  ['Festival Ribera Viva', 'Valladolid', 'Castilla y León', 3000, 'aplazado'],
];
export const LEADS = SALAS.map(([nombre, ciudad, region, aforo, estado], i) => ({
  id: 'l' + i, nombre_sala: nombre, ciudad, region, aforo, genero: 'Rock / Fusión', tipo: i === 7 ? 'festival' : 'sala',
  email_contacto: `programacion@${nombre.toLowerCase().replace(/[^a-z]/g, '')}.example`, telefono: '', instagram: '', fuente: 'scout',
  estado, pitch_generado: i < 5 ? 'Hola, somos…' : '', notas: '', band_id: 'bakandeya', es_verificado: i % 2 === 0,
}));

export const CONCIERTOS = (
  [
    ['2026-06-20', 'Sala Mercurio', 'Madrid', 450, 'pendiente'],
    ['2026-06-27', 'La Fábrica del Sur', 'Sevilla', 600, 'pendiente'],
    ['2026-07-11', 'Teatro Bóveda', 'Zaragoza', 800, 'pendiente'],
    ['2026-07-25', 'Festival Ribera Viva', 'Valladolid', 1500, 'anticipo'],
    ['2026-06-05', 'Café Pleamar', 'Vigo', 300, 'pagado'],
  ] as const
).map(([fecha, sala, ciudad, cache, estado_pago], i) => ({
  id: 'c' + i, fecha, sala, ciudad, cache, aforo_vendido: 0, aforo_total: 400, contrato_firmado: true, estado_pago, notas: '', tipo: 'sala', band_id: 'bakandeya',
}));

const C66 = (id: string, fecha: string, sala: string, ciudad: string, cache: number, tipo: string) => ({
  id, fecha, sala, ciudad, cache, aforo_vendido: 0, aforo_total: 500, contrato_firmado: true, estado_pago: 'pendiente', notas: '', tipo, band_id: RUTA66.band_id, bandName: RUTA66.nombre,
});
export const CONCIERTOS_RUTA66 = [
  C66('r66-1', '2026-06-19', 'Bar La Gasolinera', 'Burgos', 500, 'sala'),
  C66('r66-2', '2026-07-04', 'Club Interestatal', 'Alcalá de Henares', 650, 'sala'),
  C66('r66-3', '2026-07-18', 'Fiestas de San Roque', 'Segovia', 1800, 'ayuntamiento'),
];
export const ENSAYOS_RUTA66 = [{ id: 'r66-e1', fecha: '2026-06-24', hora: '21:00', lugar: 'Local Ruta 66', asistentes: [], notas: '', estado: 'programado', tipo_evento: 'ensayo', band_id: RUTA66.band_id, bandName: RUTA66.nombre }];

export const ENSAYOS = [{ id: 'r1', fecha: '2026-06-17', hora: '19:30', lugar: 'Local de ensayo', asistentes: [], notas: '', estado: 'programado', tipo_evento: 'ensayo', band_id: 'bakandeya' }];

export const FANS = Array.from({ length: 46 }, (_, i) => ({
  id: 'f' + i, nombre: 'Fan ' + i, email: `fan${i}@example.com`, ciudad: ['Madrid', 'Sevilla', 'Vigo'][i % 3], comoConocio: i % 4 ? 'Únete' : 'Directo',
  fechaCaptura: new Date(Date.UTC(2026, Math.floor(i / 8), 3 + (i % 20))).toISOString().slice(0, 10), consentimientoRgpd: true, band_id: 'bakandeya',
}));

export const METRICAS = Array.from({ length: 30 }, (_, i) => ({
  id: 'm' + i, fecha: new Date(Date.UTC(2026, 4, 17 + i)).toISOString().slice(0, 10),
  instagram: 1200 + i * 38 + Math.round(Math.sin(i / 3) * 90), tiktok: 800 + i * 71 + (i % 6) * 40, youtube: 300 + i * 12, spotify: 2100 + i * 55 + (i % 7) * 60, notas: '',
}));

export const EPK_CONFIG = {
  bandId: 'bakandeya',
  biografia:
    'Bakandeya es una propuesta de mestizaje que mezcla balkan-ska, reggae y electrónica analógica, con violín solista, sintetizadores, percusión en vivo, bajo y voz. Directos de 90 minutos pensados para que la sala baile de principio a fin: más de 40 conciertos en salas y festivales de la península.',
  fraseImpacto: 'Violín, ska y sintetizadores: bailar como si mañana no hubiera furgo.',
  genero: 'Balkan-ska · Reggae · Electrónica',
  bandasSimilares: ['Gogol Bordello', 'Manu Chao', 'Dubioza Kolektiv'],
  mostrarBandasSimilares: true,
  logoUrl: BANDA.logo,
  miembros: MIEMBROS,
  bandPhotos: [demoImg('escena-1'), demoImg('escena-2'), demoImg('escena-3')],
  riderTecnico: '1 PA estéreo acorde al aforo\n16 canales con 4 envíos de monitores\n2 micrófonos dinámicos de voz\nLíneas DI para violín y sintetizadores\nMicrofonía de percusión estándar\n1 línea DI para bajo',
  enlacesRedes: {
    instagram: 'https://instagram.com/bakandeya_oficial',
    spotify: 'https://open.spotify.com/artist/bakandeya',
    youtube: 'https://youtube.com/@bakandeya_oficial',
    tiktok: 'https://tiktok.com/@bakandeya_oficial',
    bandcamp: 'https://bakandeya.bandcamp.com',
  },
  contactoBooking: { nombre: 'Booking & Management', email: 'booking@bakandeya.example', telefono: '+34 600 000 000' },
  temasDestacadosIds: ['d1', 'd2', 'd3', 'd5'],
  datosContratacion: { tieneTecnicoSonidoPropio: false, transportePropio: true, hospedajeRequerido: true, facturacion: 'asociacion' },
  riderConfig: { tipoMonitoreo: 'mixto', canalesMinimos: 16, backlinePropio: 'parcial', tiempoPruebaMinutos: 45 },
  incentivoFans: { mensajeAgradecimiento: '¡Gracias por unirte! Aquí tienes tu regalo por venir al concierto.', enlaceDescarga: '', codigoDescuento: 'FAN-10' },
  ciudadesConfig: ['Madrid', 'Sevilla', 'Vigo', 'Bilbao'],
};

export const RESPUESTA_EPK_PUBLICO = {
  bandId: 'band-bakandeya',
  bandName: BANDA.nombre,
  logoUrl: BANDA.logo,
  epkConfig: EPK_CONFIG,
  highlightedSongs: CANCIONES.filter((c) => EPK_CONFIG.temasDestacadosIds.includes(c.id)),
  upcomingConcerts: CONCIERTOS.filter((c) => c.fecha >= '2026-06-15'),
  totalConcertsCount: CONCIERTOS.length,
};

export const ESTADO_APP = {
  leads: LEADS, rehearsals: [...ENSAYOS, ...ENSAYOS_RUTA66], concerts: [...CONCIERTOS, ...CONCIERTOS_RUTA66], posts: [], payments: [], metrics: METRICAS, songs: CANCIONES, setlists: SETLISTS,
  bands: [], tours: [], fans: FANS, campaigns: [], messages: [], runOfShow: {}, gearChecklists: {}, epkConfig: EPK_CONFIG, autonomyConfig: {},
  registeredBands: [], users: [], categoryTemplates: {},
};
