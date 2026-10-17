// Escritura diferida del respaldo local del estado (data.json). La caché en memoria es la fuente de
// lectura; el disco solo sirve para sobrevivir a un reinicio. Antes cada saveState serializaba y
// escribía TODO el estado (todas las bandas) de forma síncrona: ~100 llamadas en rutas calientes
// bloqueando el event loop. Ahora se agrupan en una escritura asíncrona cada `retrasoMs` y se vacía
// de forma síncrona al salir el proceso.

import fs from "fs";

interface OpcionesEscritor {
  ruta: string;
  /** Instantánea del contenido a guardar (null = nada que guardar); se llama una vez por escritura, no por cada programar(). */
  serializar: () => string | null;
  retrasoMs?: number;
}

export interface EscritorDiferido {
  /** Marca el estado como sucio y agenda (una sola vez) la escritura. */
  programar: () => void;
  /** Escribe ya y de forma síncrona lo pendiente. Para el cierre del proceso. */
  vaciar: () => void;
  /** Se resuelve cuando no hay escritura asíncrona en curso (tests y cierre ordenado). */
  inactivo: () => Promise<void>;
}

export function crearEscritorDiferido({ ruta, serializar, retrasoMs = 2000 }: OpcionesEscritor): EscritorDiferido {
  let sucio = false;
  let temporizador: NodeJS.Timeout | undefined;
  let enCurso: Promise<void> = Promise.resolve();

  const nombreTemporal = () => `${ruta}.${Date.now()}.${Math.random().toString(36).substring(2, 6)}.tmp`;

  async function escribir(contenido: string) {
    const tmp = nombreTemporal();
    await fs.promises.writeFile(tmp, contenido, "utf-8");
    try {
      await fs.promises.rename(tmp, ruta);
    } catch {
      // Fallback si rename falla entre montajes o permisos de disco
      await fs.promises.writeFile(ruta, contenido, "utf-8");
      await fs.promises.unlink(tmp).catch(() => { /* el temporal ya no existe: nada que limpiar */ });
    }
  }

  function escribirSync(contenido: string) {
    const tmp = nombreTemporal();
    fs.writeFileSync(tmp, contenido, "utf-8");
    try {
      fs.renameSync(tmp, ruta);
    } catch {
      fs.writeFileSync(ruta, contenido, "utf-8");
      try { fs.unlinkSync(tmp); } catch { /* el temporal ya no existe: nada que limpiar */ }
    }
  }

  return {
    programar() {
      sucio = true;
      if (temporizador) return;
      temporizador = setTimeout(() => {
        temporizador = undefined;
        if (!sucio) return;
        sucio = false;
        // Encadenadas: dos escrituras nunca compiten por el mismo fichero.
        enCurso = enCurso
          .then(() => { const c = serializar(); return c === null ? undefined : escribir(c); })
          .catch((e) => { console.error("Error saving data.json", e); });
      }, retrasoMs);
      temporizador.unref();
    },
    vaciar() {
      if (temporizador) { clearTimeout(temporizador); temporizador = undefined; }
      if (!sucio) return;
      sucio = false;
      try {
        const c = serializar();
        if (c !== null) escribirSync(c);
      } catch (e) {
        console.error("Error saving data.json", e);
      }
    },
    inactivo: () => enCurso,
  };
}

/** Vacía el escritor al terminar el proceso (exit normal, SIGTERM de un despliegue, Ctrl+C). */
export function vaciarAlSalir(escritor: EscritorDiferido): void {
  process.once("exit", () => escritor.vaciar());
  if (process.env.VITEST) return; // los tests no deben interceptar señales del runner
  // Un manejador de señal desactiva la salida por defecto: hay que salir explícitamente.
  for (const [senal, codigo] of [["SIGTERM", 143], ["SIGINT", 130]] as const) {
    process.once(senal, () => {
      escritor.vaciar();
      process.exit(codigo);
    });
  }
}
