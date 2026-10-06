import { Request, Response, NextFunction } from "express";

interface RateLimitStore {
  [clave: string]: { count: number; resetTime: number };
}

const rateLimitStore: RateLimitStore = {};

/**
 * El mapa solo se tocaba al recibir peticiones, así que las entradas de IPs que ya no vuelven
 * se quedaban dentro para siempre: en un proceso de larga vida es una fuga lenta pero segura.
 * Una barrida periódica lo mantiene acotado.
 */
const INTERVALO_LIMPIEZA_MS = 10 * 60 * 1000;
const temporizadorLimpieza = setInterval(() => {
  const ahora = Date.now();
  for (const clave of Object.keys(rateLimitStore)) {
    if (rateLimitStore[clave].resetTime < ahora) delete rateLimitStore[clave];
  }
}, INTERVALO_LIMPIEZA_MS);
// Que este temporizador no impida al proceso terminar.
if (typeof temporizadorLimpieza.unref === "function") temporizadorLimpieza.unref();

/** Solo para los tests. */
export function _vaciarRateLimitStore() {
  for (const clave of Object.keys(rateLimitStore)) delete rateLimitStore[clave];
}

let contadorLimitadores = 0;

/**
 * La clave lleva el nombre del limitador por delante. Sin ese prefijo todos comparten
 * contador: gastar el cupo analizando dejaba sin cupo a los renderizados, porque el mismo
 * número se comparaba contra dos máximos distintos.
 */
/**
 * IP del cliente que NO se puede falsear desde fuera.
 *
 * Antes se usaba la PRIMERA entrada de X-Forwarded-For, que es la que escribe el propio cliente:
 * mandando `X-Forwarded-For: 1.2.3.N` con una N distinta en cada petición se saltaba cualquier
 * límite (login incluido). El proxy de Railway AÑADE la IP real al final de la cabecera, así que
 * la fiable es la ÚLTIMA entrada (igual que `ipFirmante` en routes/deals.ts).
 */
export function ipDelCliente(req: Request): string {
  const xff = String(req.headers["x-forwarded-for"] || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return xff[xff.length - 1] || req.ip || "127.0.0.1";
}

function claveDePeticion(req: Request, porUsuario: boolean, ambito: string): string {
  const ip = ipDelCliente(req);
  if (!porUsuario) return `${ambito}|${ip}`;
  // Detrás de un NAT o de una red de móvil, muchos usuarios comparten IP: contar por usuario
  // evita que uno agote el cupo de toda su sala de ensayo.
  const userId = (req as any).user?.id;
  return `${ambito}|${userId ? `u:${userId}` : ip}`;
}

/**
 * Rate limiter middleware for sensitive endpoints like login.
 * Limits IP requests within a time window.
 */
export function createRateLimiter(
  options: { windowMs?: number; maxRequests?: number; porUsuario?: boolean; mensaje?: string; nombre?: string } = {}
) {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute window
  const maxRequests = options.maxRequests || 15; // 15 requests max
  const porUsuario = options.porUsuario ?? false;
  const ambito = options.nombre || `lim${++contadorLimitadores}`;
  const mensaje =
    options.mensaje || "Demasiadas peticiones. Por favor, espera un momento antes de volver a intentarlo.";

  return function rateLimiter(req: Request, res: Response, next: NextFunction) {
    const clave = claveDePeticion(req, porUsuario, ambito);
    const now = Date.now();

    if (!rateLimitStore[clave] || rateLimitStore[clave].resetTime < now) {
      rateLimitStore[clave] = { count: 1, resetTime: now + windowMs };
      return next();
    }

    rateLimitStore[clave].count += 1;

    if (rateLimitStore[clave].count > maxRequests) {
      const esperaSeg = Math.max(1, Math.ceil((rateLimitStore[clave].resetTime - now) / 1000));
      res.setHeader("Retry-After", String(esperaSeg));
      return res.status(429).json({ success: false, error: mensaje, retryAfter: esperaSeg });
    }

    next();
  };
}

export const loginRateLimiter = createRateLimiter({ nombre: "login", windowMs: 60 * 1000, maxRequests: 10 });

/** Altas de cuenta: sin tope servía para probar contraseñas ajenas y para llenar la BD de bandas. */
export const registroRateLimiter = createRateLimiter({
  nombre: "registro",
  windowMs: 10 * 60 * 1000,
  maxRequests: 10,
  mensaje: "Demasiados intentos de registro desde esta conexión. Espera unos minutos."
});

/** Formularios públicos sin sesión (fans, lista de espera, clics): evita el spam y el relleno de la BD. */
export const publicoRateLimiter = createRateLimiter({
  nombre: "publico",
  windowMs: 60 * 1000,
  maxRequests: 30,
  mensaje: "Demasiadas peticiones seguidas. Espera un momento."
});

/** Reenviar el acuerdo por email desde el enlace público: es envío de correo con la marca de la plataforma. */
export const reenvioEmailRateLimiter = createRateLimiter({
  nombre: "reenvio-email",
  windowMs: 10 * 60 * 1000,
  maxRequests: 5,
  mensaje: "Has pedido varios reenvíos seguidos. Espera unos minutos."
});

/**
 * Límite para el análisis con IA: cada llamada cuesta dinero en tokens y además puede lanzar
 * ffmpeg para medir el audio. Sin tope, una pestaña con un bucle dispara la factura.
 */
export const iaRateLimiter = createRateLimiter({
  nombre: "ia",
  windowMs: 5 * 60 * 1000,
  maxRequests: 20,
  porUsuario: true,
  mensaje: "Has lanzado muchos análisis seguidos. Espera un momento antes de volver a intentarlo."
});

/**
 * Límite para el renderizado de clips: descarga vídeo y lanza ffmpeg, así que es lo más caro
 * en CPU y en disco de toda la aplicación.
 */
export const renderRateLimiter = createRateLimiter({
  nombre: "render",
  windowMs: 5 * 60 * 1000,
  maxRequests: 10,
  porUsuario: true,
  mensaje: "Has pedido demasiados renderizados seguidos. Espera un momento y vuelve a intentarlo."
});

/**
 * Límite para crear sesiones de Checkout de donación: cada llamada pega
 * contra la API de Stripe (coste real y cuota), y sin tope un usuario podría
 * generar sesiones sin fin sin llegar nunca a pagar ninguna.
 */
export const donationRateLimiter = createRateLimiter({
  nombre: "donation",
  windowMs: 5 * 60 * 1000,
  maxRequests: 10,
  porUsuario: true,
  mensaje: "Has pedido demasiadas sesiones de pago seguidas. Espera un momento antes de volver a intentarlo."
});

/* ------------------------------------------------------- trabajos simultáneos */

/**
 * Tope de trabajos pesados a la vez. El límite por ventana no basta: diez peticiones en el
 * mismo segundo pasan el filtro y lanzan diez ffmpeg de 1080p a la vez, que en el contenedor
 * de Railway se lleva por delante la memoria del proceso entero.
 */
export function createConcurrencyLimiter(options: { max?: number; mensaje?: string } = {}) {
  const max = Math.max(1, options.max ?? 2);
  const mensaje =
    options.mensaje || "El servidor está procesando otros vídeos ahora mismo. Inténtalo de nuevo en un minuto.";
  let enCurso = 0;

  return function concurrencyLimiter(req: Request, res: Response, next: NextFunction) {
    if (enCurso >= max) {
      res.setHeader("Retry-After", "60");
      return res.status(503).json({ success: false, error: mensaje, retryAfter: 60 });
    }

    enCurso++;
    let liberado = false;
    const liberar = () => {
      if (liberado) return;
      liberado = true;
      enCurso = Math.max(0, enCurso - 1);
    };
    // `close` cubre también al cliente que se va a mitad, que si no dejaría el hueco pillado.
    res.on("finish", liberar);
    res.on("close", liberar);

    next();
  };
}

export const renderConcurrencyLimiter = createConcurrencyLimiter({ max: 2 });
