/**
 * Qué falta para que un Reel programado salga solo y, si falla, avise por email.
 * Todo puro: el script `probar:publicacion` reúne el estado real y lo pasa aquí.
 */
export interface EstadoPreparacion {
  resendKey: boolean;
  appUrl: string | undefined;
  supabaseOk: boolean;
  /** Tablas que el flujo necesita y si existen. */
  tablas: Record<string, boolean>;
  /** Columnas de `social_posts` que el worker usa y no existen. */
  columnasPostsFaltan: string[];
  banda?: {
    existe: boolean;
    avisosActivados: boolean;
    destinatario: string | null;
    instagramConectado: boolean;
    pendientesDeSalir: number;
  };
}

export interface Comprobacion {
  nombre: string;
  estado: "ok" | "falta" | "aviso";
  detalle: string;
  arreglo?: string;
}

const esUrlDeDesarrollo = (u: string) => /localhost|127\.0\.0\.1|webcontainer|ais-dev|ais-pre|googleusercontent/i.test(u);

export function evaluarPreparacion(e: EstadoPreparacion): Comprobacion[] {
  const r: Comprobacion[] = [];

  r.push(
    e.resendKey
      ? { nombre: "Clave de Resend", estado: "ok", detalle: "Configurada." }
      : { nombre: "Clave de Resend", estado: "falta", detalle: "Sin clave, el aviso por email no sale (solo queda un aviso en los logs).", arreglo: "Define RESEND_API_KEY en Railway y verifica el dominio remitente en Resend." }
  );

  r.push(
    e.appUrl && !esUrlDeDesarrollo(e.appUrl)
      ? { nombre: "APP_URL", estado: "ok", detalle: e.appUrl }
      : { nombre: "APP_URL", estado: "aviso", detalle: "No está o apunta a un entorno de desarrollo: los enlaces del correo irían a https://bandmanager.io.", arreglo: "Define APP_URL con la dirección pública de la app." }
  );

  r.push(
    e.supabaseOk
      ? { nombre: "Conexión a Supabase", estado: "ok", detalle: "Responde." }
      : { nombre: "Conexión a Supabase", estado: "falta", detalle: "No se pudo conectar, así que lo demás no se ha podido comprobar.", arreglo: "Revisa SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY." }
  );

  if (e.supabaseOk) {
    const sinTabla = Object.entries(e.tablas).filter(([, ok]) => !ok).map(([t]) => t);
    r.push(
      sinTabla.length
        ? { nombre: "Tablas", estado: "falta", detalle: `Faltan: ${sinTabla.join(", ")}.`, arreglo: "Aplica las migraciones pendientes de supabase/migrations." }
        : { nombre: "Tablas", estado: "ok", detalle: Object.keys(e.tablas).join(", ") + "." }
    );
    r.push(
      e.columnasPostsFaltan.length
        ? { nombre: "Columnas de social_posts", estado: "falta", detalle: `Faltan: ${e.columnasPostsFaltan.join(", ")}.`, arreglo: "Aplica las migraciones pendientes de supabase/migrations." }
        : { nombre: "Columnas de social_posts", estado: "ok", detalle: "Todas presentes." }
    );
  }

  const b = e.banda;
  if (b) {
    if (!b.existe) {
      r.push({ nombre: "Banda", estado: "falta", detalle: "No existe una banda con ese id.", arreglo: "Revisa el id de banda que has pasado." });
      return r;
    }
    r.push(
      b.avisosActivados
        ? { nombre: "Avisos por email", estado: "ok", detalle: "Activados." }
        : { nombre: "Avisos por email", estado: "falta", detalle: "Desactivados en los ajustes de avisos de la banda: no llegará ningún correo.", arreglo: "Actívalos en Ajustes › Avisos." }
    );
    r.push(
      b.destinatario
        ? { nombre: "Destinatario del aviso", estado: "ok", detalle: b.destinatario }
        : { nombre: "Destinatario del aviso", estado: "falta", detalle: "No hay email de aviso ni email de la banda.", arreglo: "Indica un email en Ajustes › Avisos." }
    );
    r.push(
      b.instagramConectado
        ? { nombre: "Instagram conectado", estado: "ok", detalle: "La banda tiene token y cuenta profesional." }
        : { nombre: "Instagram conectado", estado: "aviso", detalle: "Sin cuenta conectada el Reel no se publica solo: queda en modo asistido, para subirlo a mano.", arreglo: "Conecta una cuenta profesional de Instagram en Métricas." }
    );
    r.push({ nombre: "Reels pendientes de salir", estado: "ok", detalle: `${b.pendientesDeSalir}.` });
  }
  return r;
}

const ICONO = { ok: "✔", falta: "✘", aviso: "!" } as const;

export function formatearPreparacion(comprobaciones: Comprobacion[]): string {
  const lineas = comprobaciones.flatMap((c) => [
    `${ICONO[c.estado]} ${c.nombre}: ${c.detalle}`,
    ...(c.estado !== "ok" && c.arreglo ? [`    → ${c.arreglo}`] : [])
  ]);
  const faltan = comprobaciones.filter((c) => c.estado === "falta").length;
  const avisos = comprobaciones.filter((c) => c.estado === "aviso").length;
  const resumen = faltan
    ? `Faltan ${faltan} ${faltan === 1 ? "cosa" : "cosas"} por arreglar${avisos ? ` y hay ${avisos} ${avisos === 1 ? "aviso" : "avisos"}` : ""}.`
    : avisos
      ? `Todo listo, con ${avisos} ${avisos === 1 ? "aviso" : "avisos"}.`
      : "Todo listo.";
  return [...lineas, "", resumen].join("\n");
}
