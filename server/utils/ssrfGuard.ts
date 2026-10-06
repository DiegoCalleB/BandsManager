import dns from "dns/promises";
import net from "net";
import http from "http";
import https from "https";
import fs from "fs";

// server/auto_enrichment.ts, leads/enrichment.ts, leads/places.ts y ai_music.ts hacen peticiones a URLs externas
// provistas por usuarios o APIs. Sin esta comprobación con IP Pinning, un atacante puede ejecutar
// DNS rebinding cambiando el registro DNS en el intervalo entre la validación y la conexión real (TOCTOU).
// Esta utilidad valida las IPs y ancla la conexión a nivel de socket a la IP resuelta y validada.

// Lista de rangos NO enrutables públicamente. `net.BlockList` normaliza por sí sola las formas
// IPv4-mapped (::ffff:127.0.0.1 y ::ffff:7f00:1) y las abreviaturas IPv6, que la comprobación
// anterior por prefijo de texto no cubría (p. ej. «::ffff:7f00:1» llegaba a la red interna).
const RANGOS_RESERVADOS = new net.BlockList();
for (const [red, bits] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16],
  ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15],
  ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4]
] as Array<[string, number]>) RANGOS_RESERVADOS.addSubnet(red, bits, "ipv4");
for (const [red, bits] of [
  ["::", 128], ["::1", 128], ["64:ff9b::", 96], ["100::", 64], ["2001::", 32], ["2001:db8::", 32],
  ["2002::", 16], ["fc00::", 7], ["fe80::", 10], ["fec0::", 10], ["ff00::", 8]
] as Array<[string, number]>) RANGOS_RESERVADOS.addSubnet(red, bits, "ipv6");

export function esIpPrivadaOReservada(ip: string): boolean {
  // Los corchetes de una IPv6 literal en una URL («[::1]») no forman parte de la dirección.
  const limpia = ip.replace(/^\[|\]$/g, "").split("%")[0];
  if (net.isIPv4(limpia)) return RANGOS_RESERVADOS.check(limpia, "ipv4");
  if (net.isIPv6(limpia)) return RANGOS_RESERVADOS.check(limpia, "ipv6");
  return true; // no es una IP reconocible: por seguridad, no se confía
}

export interface ValidatedUrlResult {
  segura: boolean;
  ipPin?: string;
  parsedUrl?: URL;
  error?: string;
}

/**
 * Valida la URL y resuelve sus direcciones DNS verificando que no pertenezcan a rangos privados/reservados.
 */
export async function validarYResolverUrlSegura(rawUrl: string): Promise<ValidatedUrlResult> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { segura: false, error: "URL inválida" };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { segura: false, error: "Protocolo no permitido (solo http/https)" };
  }

  // Una IPv6 literal llega como «[::1]»: se quitan los corchetes para validarla como IP.
  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    return { segura: false, error: "Host local o reservado" };
  }

  // Si el host ya es una IP literal, se valida directamente.
  if (net.isIP(hostname)) {
    if (esIpPrivadaOReservada(hostname)) {
      return { segura: false, error: "IP privada o reservada" };
    }
    return { segura: true, ipPin: hostname, parsedUrl: parsed };
  }

  try {
    const resolved = await dns.lookup(hostname, { all: true });
    if (resolved.length === 0) {
      return { segura: false, error: "No se pudo resolver el host DNS" };
    }
    const todasSeguras = resolved.every((r) => !esIpPrivadaOReservada(r.address));
    if (!todasSeguras) {
      return { segura: false, error: "El host resuelve a rangos IP privados o reservados" };
    }
    // Seleccionar la primera IP segura resuelta para anclarla (Pinning anti-TOCTOU)
    return { segura: true, ipPin: resolved[0].address, parsedUrl: parsed };
  } catch (err: any) {
    return { segura: false, error: err?.message || "Error en resolución DNS" };
  }
}

export async function esUrlExternaSegura(rawUrl: string): Promise<boolean> {
  const res = await validarYResolverUrlSegura(rawUrl);
  return res.segura;
}

/**
 * Crea un agente HTTP/HTTPS con IP Pinning que intercepta el lookup de DNS
 * y fuerza la conexión de socket directamente a la IP validada, pasando el Host original para SNI y cabeceras.
 */
export function crearAgenteIpPinneada(ipPin: string, isHttps: boolean) {
  // Desde Node 20 los sockets llaman al lookup con { all: true } (autoSelectFamily) y esperan un
  // ARRAY de direcciones; devolver una sola cadena produce «Invalid IP address: undefined» y
  // TODA petición anclada fallaba, también las de Supabase. Se atienden las dos formas.
  const family = net.isIPv6(ipPin) ? 6 : 4;
  const customLookup = (_hostname: string, options: any, callback: (...args: any[]) => void) => {
    if (options && options.all) callback(null, [{ address: ipPin, family }]);
    else callback(null, ipPin, family);
  };
  return isHttps
    ? new https.Agent({ lookup: customLookup, keepAlive: false })
    : new http.Agent({ lookup: customLookup, keepAlive: false });
}

/**
 * Realiza una petición HTTP/HTTPS segura con anclaje de IP resuelta (Anti-DNS Rebinding / Anti-TOCTOU).
 */
export async function fetchUrlExternaSegura(
  rawUrl: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    timeoutMs?: number;
    maxBytes?: number;
    /** Redirecciones a seguir (0 = ninguna). Cada salto se revalida entero (DNS + rangos privados). */
    maxRedirects?: number;
  } = {}
): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; buffer: Buffer; text: () => string; json: () => any }> {
  const respuesta = await peticionUnica(rawUrl, options);
  const ubicacion = respuesta.headers.location;
  const saltos = options.maxRedirects ?? 0;
  if (saltos > 0 && respuesta.statusCode >= 300 && respuesta.statusCode < 400 && ubicacion) {
    // La URL del salto se resuelve contra la actual y se vuelve a validar desde cero.
    const siguiente = new URL(ubicacion, rawUrl).toString();
    return fetchUrlExternaSegura(siguiente, { ...options, maxRedirects: saltos - 1 });
  }
  return respuesta;
}

type RespuestaSegura = { statusCode: number; headers: http.IncomingHttpHeaders; buffer: Buffer; text: () => string; json: () => any };

async function peticionUnica(
  rawUrl: string,
  options: { method?: string; headers?: Record<string, string>; timeoutMs?: number; maxBytes?: number }
): Promise<RespuestaSegura> {
  const validated = await validarYResolverUrlSegura(rawUrl);
  if (!validated.segura || !validated.ipPin || !validated.parsedUrl) {
    throw new Error(`SSRF_BLOCKED: ${validated.error || "URL no segura o no verificada"}`);
  }

  const { parsedUrl, ipPin } = validated;
  const isHttps = parsedUrl.protocol === "https:";
  const agent = crearAgenteIpPinneada(ipPin, isHttps);
  const timeoutMs = options.timeoutMs || 15000;
  const maxBytes = options.maxBytes || 50 * 1024 * 1024; // 50MB por defecto

  return new Promise((resolve, reject) => {
    const reqOptions: http.RequestOptions = {
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || "GET",
      headers: {
        Host: parsedUrl.host,
        "User-Agent": "BandManager-AudioClient/1.0",
        ...(options.headers || {})
      },
      agent,
      timeout: timeoutMs
    };

    if (isHttps) {
      // Garantizar SNI en el handshake TLS con el hostname original
      (reqOptions as https.RequestOptions).servername = parsedUrl.hostname;
    }

    const client = isHttps ? https : http;
    const req = client.request(reqOptions, (res) => {
      const chunks: Buffer[] = [];
      let totalBytes = 0;

      res.on("data", (chunk: Buffer) => {
        totalBytes += chunk.length;
        if (totalBytes > maxBytes) {
          req.destroy(new Error(`Payload excedió el tamaño máximo permitido (${maxBytes} bytes)`));
          return;
        }
        chunks.push(chunk);
      });

      res.on("end", () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          statusCode: res.statusCode || 200,
          headers: res.headers,
          buffer,
          text: () => buffer.toString("utf-8"),
          json: () => JSON.parse(buffer.toString("utf-8"))
        });
      });
    });

    req.on("timeout", () => {
      req.destroy(new Error(`Petición abortada por timeout (${timeoutMs}ms)`));
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.end();
  });
}

/**
 * Descarga un recurso externo a memoria con la guardia completa (IP anclada, rangos privados,
 * redirecciones revalidadas). Devuelve null si la URL no es segura, falla o responde con error:
 * los llamadores existentes ya tratan «no se pudo descargar» como un caso normal.
 */
export async function descargarBufferSeguro(
  rawUrl: string,
  opciones: { headers?: Record<string, string>; timeoutMs?: number; maxBytes?: number; method?: string } = {}
): Promise<{ buffer: Buffer; headers: http.IncomingHttpHeaders; statusCode: number } | null> {
  try {
    const res = await fetchUrlExternaSegura(rawUrl, { maxRedirects: 3, timeoutMs: 45000, maxBytes: 150 * 1024 * 1024, ...opciones });
    if (res.statusCode >= 400) return null;
    return { buffer: res.buffer, headers: res.headers, statusCode: res.statusCode };
  } catch (err: any) {
    console.warn("[ssrfGuard] descarga rechazada o fallida:", String(err?.message || err).substring(0, 160));
    return null;
  }
}

/**
 * Descarga de forma segura un archivo multimedia hacia un destino local anclando la IP de conexión.
 */
export async function descargarArchivoSeguro(rawUrl: string, destinoPath: string, maxBytes = 150 * 1024 * 1024): Promise<void> {
  const res = await fetchUrlExternaSegura(rawUrl, { maxBytes, timeoutMs: 60000, maxRedirects: 3 });
  if (res.statusCode >= 400) {
    throw new Error(`Error HTTP ${res.statusCode} descargando archivo`);
  }
  fs.writeFileSync(destinoPath, res.buffer);
}
