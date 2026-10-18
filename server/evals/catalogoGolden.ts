// Banco de evaluación del catálogo compartido de salas: tres promesas que no pueden romperse en silencio.
//  1. Desduplicación: las variantes de escribir una misma sala dan la misma clave, y salas distintas NO se fusionan
//     (fusionar dos salas es peor que dejar un duplicado).
//  2. Fiabilidad: las señales dan el nivel esperado (una sala sin contactar nunca sale «verificada»).
//  3. Privacidad: contactos de personas, móviles y enlaces peligrosos no llegan al catálogo.
// Determinista y sin red: corre en CI. Misma convención que el Lector y el Redactor: `conocido` marca un fallo actual.
import { calcularFiabilidad, claveSala, emailDeRol, telefonoFijoEs, urlPublica, type NivelSala, type SenalesFiabilidad } from '../utils/salaCatalogo.js';

const AHORA = new Date('2026-10-18T12:00:00Z');

export interface CasoClave { id: string; a: { nombre: string; ciudad: string; placeId?: string }; b: { nombre: string; ciudad: string; placeId?: string }; misma: boolean; conocido?: string }
export interface CasoNivel { id: string; senales: Partial<SenalesFiabilidad>; esperado: NivelSala; conocido?: string }
export interface CasoPrivacidad { id: string; tipo: 'email' | 'telefono' | 'url'; entrada: string; permitido: boolean; conocido?: string }

export const CASOS_CLAVE: CasoClave[] = [
  { id: 'dup-01', a: { nombre: 'Sala Apolo', ciudad: 'Barcelona' }, b: { nombre: 'sala apolo', ciudad: 'barcelona' }, misma: true },
  { id: 'dup-02', a: { nombre: 'Sala Apolo', ciudad: 'Barcelona' }, b: { nombre: '  SALA   APOLO ', ciudad: 'Barcelona ' }, misma: true },
  { id: 'dup-03', a: { nombre: 'Café Berlín', ciudad: 'Madrid' }, b: { nombre: 'Cafe Berlin', ciudad: 'Madrid' }, misma: true },
  { id: 'dup-04', a: { nombre: 'La Riviera', ciudad: 'Madrid' }, b: { nombre: 'La Riviera.', ciudad: 'MADRID' }, misma: true },
  { id: 'dup-05', a: { nombre: 'Sala X', ciudad: 'Vigo', placeId: 'P1' }, b: { nombre: 'Otro nombre', ciudad: 'Otra ciudad', placeId: 'P1' }, misma: true },
  { id: 'dif-01', a: { nombre: 'Sala Apolo', ciudad: 'Barcelona' }, b: { nombre: 'Teatro Apolo', ciudad: 'Barcelona' }, misma: false },
  { id: 'dif-02', a: { nombre: 'Sala Apolo', ciudad: 'Barcelona' }, b: { nombre: 'Sala Apolo', ciudad: 'Valencia' }, misma: false },
  { id: 'dif-03', a: { nombre: 'Sala Apolo 2', ciudad: 'Barcelona' }, b: { nombre: 'Sala Apolo', ciudad: 'Barcelona' }, misma: false },
  { id: 'dif-04', a: { nombre: 'Sala X', ciudad: 'Vigo', placeId: 'P1' }, b: { nombre: 'Sala X', ciudad: 'Vigo', placeId: 'P2' }, misma: false },
  { id: 'dif-05', a: { nombre: 'El Sol', ciudad: 'Madrid' }, b: { nombre: 'El Sol Rock', ciudad: 'Madrid' }, misma: false },
];

export const CASOS_NIVEL: CasoNivel[] = [
  { id: 'niv-01', senales: {}, esperado: 'sin_verificar' },
  { id: 'niv-02', senales: { webDeclarada: true, emailValido: true }, esperado: 'sin_verificar' },
  { id: 'niv-03', senales: { placeId: true }, esperado: 'sin_verificar' },
  { id: 'niv-04', senales: { placeId: true, webDeclarada: true, emailValido: true }, esperado: 'probable' },
  { id: 'niv-05', senales: { bandasConRespuesta: 1, bandasConEntrega: 1, emailValido: true, webDeclarada: true }, esperado: 'probable' },
  { id: 'niv-06', senales: { placeId: true, bandasConRespuesta: 1, bandasConEntrega: 1, emailValido: true, webDeclarada: true }, esperado: 'verificada' },
  { id: 'niv-07', senales: { placeId: true, webDeclarada: true, webResponde: true, emailValido: true }, esperado: 'probable' },
  { id: 'niv-08', senales: { placeId: true, bandasConRespuesta: 1, bandasConEntrega: 1, emailValido: true, rebotes: 1 }, esperado: 'sin_verificar' },
  { id: 'niv-09', senales: { emailValido: true, rebotes: 2 }, esperado: 'sin_verificar' },
  { id: 'niv-10', senales: { placeId: true, bandasConRespuesta: 1, bandasConEntrega: 1, emailValido: true, webDeclarada: true, verificadaEn: new Date('2026-01-01T00:00:00Z') }, esperado: 'probable' },
];

export const CASOS_PRIVACIDAD: CasoPrivacidad[] = [
  { id: 'pri-01', tipo: 'email', entrada: 'booking@salaapolo.com', permitido: true },
  { id: 'pri-02', tipo: 'email', entrada: 'info@sala.es', permitido: true },
  { id: 'pri-03', tipo: 'email', entrada: 'maria.lopez@salaapolo.com', permitido: false },
  { id: 'pri-04', tipo: 'email', entrada: 'jorge@sala.es', permitido: false },
  { id: 'pri-05', tipo: 'email', entrada: 'info@gmail.com', permitido: false },
  { id: 'pri-06', tipo: 'email', entrada: 'programacion@hotmail.es', permitido: false },
  { id: 'pri-07', tipo: 'telefono', entrada: '934 424 000', permitido: true },
  { id: 'pri-08', tipo: 'telefono', entrada: '+34 912345678', permitido: true },
  { id: 'pri-09', tipo: 'telefono', entrada: '612 345 678', permitido: false },
  { id: 'pri-10', tipo: 'telefono', entrada: '722 111 333', permitido: false },
  { id: 'pri-11', tipo: 'url', entrada: 'https://salaapolo.com/agenda', permitido: true },
  { id: 'pri-12', tipo: 'url', entrada: 'javascript:alert(document.cookie)', permitido: false },
  { id: 'pri-13', tipo: 'url', entrada: 'data:text/html;base64,PHNjcmlwdD4=', permitido: false },
  { id: 'pri-14', tipo: 'url', entrada: 'http://localhost:3000/admin', permitido: false },
];

export interface FalloCatalogo { id: string; detalle: string; conocido?: string }
export interface ResultadoCatalogo { total: number; aciertos: number; exactitud: number; fallos: FalloCatalogo[]; porBloque: Record<'desduplicacion' | 'fiabilidad' | 'privacidad', { total: number; aciertos: number }> }

export function evaluarCatalogo(): ResultadoCatalogo {
  const fallos: FalloCatalogo[] = [];
  const porBloque: ResultadoCatalogo['porBloque'] = { desduplicacion: { total: 0, aciertos: 0 }, fiabilidad: { total: 0, aciertos: 0 }, privacidad: { total: 0, aciertos: 0 } };
  const anotar = (bloque: keyof ResultadoCatalogo['porBloque'], ok: boolean, id: string, detalle: string, conocido?: string) => {
    porBloque[bloque].total++;
    if (ok) porBloque[bloque].aciertos++;
    else fallos.push({ id, detalle, conocido });
  };

  for (const c of CASOS_CLAVE) {
    const igual = claveSala(c.a) !== null && claveSala({ placeId: c.a.placeId, nombre: c.a.nombre, ciudad: c.a.ciudad }) === claveSala({ placeId: c.b.placeId, nombre: c.b.nombre, ciudad: c.b.ciudad });
    anotar('desduplicacion', igual === c.misma, c.id, `esperado ${c.misma ? 'misma' : 'distinta'} sala, obtenido ${igual ? 'misma' : 'distinta'}`, c.conocido);
  }
  for (const c of CASOS_NIVEL) {
    const base: SenalesFiabilidad = { placeId: false, webDeclarada: false, emailValido: false, bandasConEntrega: 0, bandasConRespuesta: 0, rebotes: 0 };
    const { nivel } = calcularFiabilidad({ ...base, ...c.senales }, AHORA);
    anotar('fiabilidad', nivel === c.esperado, c.id, `esperado ${c.esperado}, obtenido ${nivel}`, c.conocido);
  }
  for (const c of CASOS_PRIVACIDAD) {
    const salida = c.tipo === 'email' ? emailDeRol(c.entrada) : c.tipo === 'telefono' ? telefonoFijoEs(c.entrada) : urlPublica(c.entrada);
    anotar('privacidad', (salida !== null) === c.permitido, c.id, `${c.tipo} «${c.entrada}»: esperado ${c.permitido ? 'permitido' : 'bloqueado'}, obtenido ${salida !== null ? 'permitido' : 'bloqueado'}`, c.conocido);
  }

  const total = Object.values(porBloque).reduce((n, b) => n + b.total, 0);
  const aciertos = Object.values(porBloque).reduce((n, b) => n + b.aciertos, 0);
  return { total, aciertos, exactitud: total ? aciertos / total : 1, fallos, porBloque };
}
