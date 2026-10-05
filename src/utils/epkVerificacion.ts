/**
 * Verificación post-guardado del EPK.
 *
 * El servidor responde 200 aunque la base de datos no haya cambiado (pasó de verdad: un
 * trigger de Postgres descartaba todos los UPDATE en silencio). Tras guardar, PUT /api/epk
 * devuelve la fila leída de la BD; aquí se compara con lo que se envió para avisar al usuario
 * de qué campos NO han quedado guardados, en vez de enseñarle un "guardado" falso.
 */

const ETIQUETAS: Record<string, string> = {
  biografia: 'Biografía',
  fraseImpacto: 'Frase de impacto',
  genero: 'Género',
  bandasSimilares: 'Bandas similares',
  mostrarBandasSimilares: 'Mostrar bandas similares',
  dossierTextoExtra: 'Texto extra del dossier',
  riderTecnico: 'Rider técnico',
  riderConfig: 'Configuración del rider',
  enlacesRedes: 'Redes y enlaces',
  contactoBooking: 'Contacto de booking',
  datosContratacion: 'Datos de contratación',
  videos: 'Vídeos',
  miembros: 'Formación de la banda',
  temasDestacadosIds: 'Temas destacados',
  plantilla: 'Plantilla',
  ordenSecciones: 'Orden de secciones',
  seccionesOcultas: 'Secciones ocultas',
};

const vacio = (v: unknown): boolean =>
  v === undefined ||
  v === null ||
  v === '' ||
  v === false ||
  (Array.isArray(v) && v.length === 0) ||
  (typeof v === 'object' && !Array.isArray(v) && Object.keys(v as object).length === 0);

/** ¿Todo lo que trae `enviado` está, igual, en `guardado`? (el servidor puede añadir más). */
function contenido(enviado: any, guardado: any): boolean {
  if (vacio(enviado)) return vacio(guardado);
  if (Array.isArray(enviado)) {
    if (!Array.isArray(guardado) || enviado.length !== guardado.length) return false;
    return enviado.every((e, i) => contenido(e, guardado[i]));
  }
  if (typeof enviado === 'object') {
    if (typeof guardado !== 'object' || guardado === null) return false;
    return Object.keys(enviado).every((k) => contenido(enviado[k], guardado[k]));
  }
  return enviado === guardado;
}

function miembrosIguales(enviado: any[], guardado: any[]): boolean {
  if (!Array.isArray(guardado) || enviado.length !== guardado.length) return false;
  return enviado.every((m, i) => {
    const g = guardado[i];
    const foto = m?.fotoUrl ?? m?.foto_url ?? '';
    return (
      !!g &&
      (m?.nombre || '') === (g.nombre || '') &&
      (m?.rol || '') === (g.rol || '') &&
      (m?.bio || '') === (g.bio || '') &&
      (m?.instagram || '') === (g.instagram || '') &&
      foto === (g.fotoUrl ?? g.foto_url ?? '')
    );
  });
}

/** Etiquetas legibles de los campos enviados que no coinciden con lo que quedó guardado. */
export function camposNoGuardados(enviado: any, guardado: any): string[] {
  if (!enviado || !guardado || typeof guardado !== 'object') return [];
  const fallos: string[] = [];
  for (const [clave, etiqueta] of Object.entries(ETIQUETAS)) {
    if (enviado[clave] === undefined) continue;
    const ok =
      clave === 'miembros'
        ? miembrosIguales(enviado.miembros || [], guardado.miembros)
        : contenido(enviado[clave], guardado[clave]);
    if (!ok) fallos.push(etiqueta);
  }
  return fallos;
}
