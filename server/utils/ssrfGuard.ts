import dns from "dns/promises";
import net from "net";
import http from "http";
import https from "https";
import fs from "fs";

// server/auto_enrichment.ts, leads/enrichment.ts, leads/places.ts y ai_music.ts hacen peticiones a URLs externas
// provistas por usuarios o APIs. Sin esta comprobación con IP Pinning, un atacante puede ejecutar
// DNS rebinding cambiando el registro DNS en el intervalo entre la validación y la conexión real (TOCTOU).
// Esta utilidad valida las IPs y ancla la conexión a nivel de socket a la IP resuelta y validada.

export function esIpPrivadaOReservada(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const partes = ip.split(".").map(Number);
    const [a, b] = partes;
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // loopback
    if (a === 169 && b === 254) return true; // link-local / metadata cloud
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 0) return true; // 0.0.0.0/8
    if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 (CGNAT)
    return false;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true; // loopback
    if (lower.startsWith("fe80:") || lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return true; // link-local
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local (fc00::/7)
    if (lower.startsWith("::ffff:")) {
      // IPv4-mapped: revalida la parte IPv4
      const v4 = lower.split(":").pop() || "";
      if (net.isIPv4(v4)) return esIpPrivadaOReservada(v4);
    }
    return false;
  }
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

  const hostname = parsed.hostname.toLowerCase();
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
  const customLookup = (_hostname: string, _options: any, callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void) => {
    const family = net.isIPv6(ipPin) ? 6 : 4;
    callback(null, ipPin, family);
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
  } = {}
): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; buffer: Buffer; text: () => string; json: () => any }> {
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
 * Descarga de forma segura un archivo multimedia hacia un destino local anclando la IP de conexión.
 */
export async function descargarArchivoSeguro(rawUrl: string, destinoPath: string, maxBytes = 150 * 1024 * 1024): Promise<void> {
  const res = await fetchUrlExternaSegura(rawUrl, { maxBytes, timeoutMs: 60000 });
  if (res.statusCode >= 400) {
    throw new Error(`Error HTTP ${res.statusCode} descargando archivo`);
  }
  fs.writeFileSync(destinoPath, res.buffer);
}
