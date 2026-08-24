import dns from "dns/promises";
import net from "net";

// server/auto_enrichment.ts, leads/enrichment.ts y leads/places.ts hacen fetch() a la URL de la
// web de un lead, un campo de texto libre que cualquier usuario puede escribir (o importar desde
// un CSV). Sin esta comprobación, un valor como "http://169.254.169.254/latest/meta-data/..." o
// "http://localhost:6379" hace que el SERVIDOR haga la petición y devuelva al cliente lo que
// encuentre, permitiendo sondear la red interna y el endpoint de metadatos de la nube (SSRF).
// Se valida tanto el host literal como la IP a la que resuelve (evita bypass por DNS rebinding).

function esIpPrivadaOReservada(ip: string): boolean {
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

export async function esUrlExternaSegura(rawUrl: string): Promise<boolean> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;

  const hostname = parsed.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) return false;

  // Si el host ya es una IP literal, se valida directamente.
  if (net.isIP(hostname)) {
    return !esIpPrivadaOReservada(hostname);
  }

  try {
    const resolved = await dns.lookup(hostname, { all: true });
    if (resolved.length === 0) return false;
    return resolved.every((r) => !esIpPrivadaOReservada(r.address));
  } catch {
    // No resuelve: no se puede confirmar que sea segura, se rechaza.
    return false;
  }
}
