/**
 * Envío de un FormData con progreso real de subida. `fetch` no expone cuántos bytes han salido, y un
 * WAV grande tarda minutos (subir + recomprimir en el servidor + guardar en Storage): sin esto la
 * pantalla se queda quieta y parece que no ha subido nada.
 */
export interface ProgresoSubida {
  /** `subiendo`: los bytes van saliendo del navegador. `procesando`: ya llegaron; el servidor recomprime y guarda. */
  fase: 'subiendo' | 'procesando';
  pct: number;
}

export interface RespuestaSubida {
  status: number;
  datos: { url?: string; error?: string } | null;
}

export function enviarConProgreso(
  url: string,
  headers: Record<string, string>,
  body: FormData,
  onProgress?: (p: ProgresoSubida) => void
): Promise<RespuestaSubida> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    for (const [clave, valor] of Object.entries(headers)) xhr.setRequestHeader(clave, valor);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.({ fase: 'subiendo', pct: Math.min(99, Math.round((e.loaded / e.total) * 100)) });
    };
    xhr.upload.onload = () => onProgress?.({ fase: 'procesando', pct: 100 });
    xhr.onerror = () => reject(new Error('Se cortó la conexión durante la subida.'));
    xhr.onabort = () => reject(new Error('Subida cancelada.'));
    xhr.onload = () => {
      let datos: RespuestaSubida['datos'] = null;
      try { datos = JSON.parse(xhr.responseText); } catch { /* respuesta no JSON (p. ej. página de error del proxy) */ }
      resolve({ status: xhr.status, datos });
    };
    xhr.send(body);
  });
}

/** El servidor rechazó el archivo con un motivo legible (4xx): se muestra tal cual, sin reintentos silenciosos. */
export class ErrorSubidaRechazada extends Error {}
