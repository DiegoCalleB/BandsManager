export type InstrumentoProfesor = 'guitarra' | 'bajo' | 'teclado' | 'voz' | 'bateria';

const REGLAS: Array<[RegExp, InstrumentoProfesor]> = [
  [/bater|drum|percu/, 'bateria'],
  [/bajo|bajist|bass/, 'bajo'],
  [/teclad|piano|key|synth|sintet|organ|órgano/, 'teclado'],
  [/voz|vocal|cant|sing|rap|mc\b|monolog/, 'voz'],
  [/guitar|ukel|banjo/, 'guitarra'],
];

/** «Bajista», «Guitarra eléctrica», «Batería»… → el instrumento del profesor; null si no se reconoce. */
export function instrumentoDesdeTexto(texto?: string | null): InstrumentoProfesor | null {
  const t = (texto ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (!t) return null;
  for (const [re, ins] of REGLAS) if (re.test(t)) return ins;
  return null;
}

/** Instrumento del usuario con sesión (campo `instrument` de su perfil), si se reconoce. */
export function instrumentoDelUsuario(): InstrumentoProfesor | null {
  try {
    const crudo = typeof localStorage !== 'undefined' ? localStorage.getItem('bandmanager_user') : null;
    return crudo ? instrumentoDesdeTexto(JSON.parse(crudo)?.instrument) : null;
  } catch {
    return null;
  }
}
