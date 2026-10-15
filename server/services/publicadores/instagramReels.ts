/**
 * Publicación real de un Reel en Instagram (Content Publishing API de Meta).
 *
 * Flujo oficial en tres pasos: crear un contenedor `media_type=REELS` con la URL pública del
 * vídeo, esperar a que Instagram termine de procesarlo (`status_code`) y publicarlo con
 * `media_publish`. Instagram descarga el vídeo él mismo: nuestro servidor no hace de proxy.
 *
 * Solo se usa el token de la PROPIA banda (guardado al conectar Instagram en Métricas). Nunca el
 * `INSTAGRAM_ACCESS_TOKEN` global del entorno: con él, todas las bandas publicarían en la misma
 * cuenta.
 */

const VERSION_GRAPH = "v21.0";
const INTERVALO_SONDEO_MS = 5_000;
/** Un Reel de 15-60 s tarda entre 10 s y 2 min en procesarse; más de 4 min es que algo va mal. */
const MAX_SONDEOS = 48;

export interface CredencialesInstagram {
  igUserId: string;
  token: string;
}

export interface ReelParaInstagram {
  videoUrl: string;
  caption: string;
}

export interface ReelPublicado {
  publishedId: string;
  permalink?: string;
}

export interface DependenciasGraph {
  fetch: typeof fetch;
  esperar: (ms: number) => Promise<void>;
}

const dependenciasReales: DependenciasGraph = {
  fetch: (input, init) => fetch(input, init),
  esperar: (ms) => new Promise((r) => setTimeout(r, ms))
};

/** Los tokens de "Instagram Login" empiezan por IG y van contra graph.instagram.com; los de Facebook Login, contra graph.facebook.com. */
export function hostGraphPara(token: string): string {
  return token.startsWith("IG") ? "https://graph.instagram.com" : "https://graph.facebook.com";
}

interface RespuestaGraph {
  id?: string;
  status_code?: string;
  status?: string;
  permalink?: string;
  error?: { message?: string };
}

async function llamarGraph(
  deps: DependenciasGraph,
  url: string,
  init?: RequestInit
): Promise<RespuestaGraph> {
  const res = await deps.fetch(url, init);
  const cuerpo = (await res.json().catch(() => ({}))) as RespuestaGraph;
  if (!res.ok || cuerpo.error) {
    throw new Error(`Instagram rechazó la petición: ${cuerpo.error?.message || `HTTP ${res.status}`}`);
  }
  return cuerpo;
}

function post(params: Record<string, string>): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString()
  };
}

export async function publicarReelInstagram(
  cred: CredencialesInstagram,
  reel: ReelParaInstagram,
  deps: DependenciasGraph = dependenciasReales
): Promise<ReelPublicado> {
  const base = `${hostGraphPara(cred.token)}/${VERSION_GRAPH}`;
  const token = encodeURIComponent(cred.token);

  const contenedor = await llamarGraph(
    deps,
    `${base}/${cred.igUserId}/media`,
    post({
      media_type: "REELS",
      video_url: reel.videoUrl,
      caption: reel.caption,
      share_to_feed: "true",
      access_token: cred.token
    })
  );
  if (!contenedor.id) throw new Error("Instagram no devolvió el contenedor del Reel.");

  for (let intento = 0; ; intento++) {
    const estado = await llamarGraph(deps, `${base}/${contenedor.id}?fields=status_code,status&access_token=${token}`);
    if (estado.status_code === "FINISHED") break;
    if (estado.status_code === "ERROR" || estado.status_code === "EXPIRED") {
      throw new Error(`Instagram no pudo procesar el vídeo: ${estado.status || estado.status_code}`);
    }
    if (intento >= MAX_SONDEOS) {
      throw new Error("Instagram sigue procesando el vídeo tras 4 minutos; no se ha publicado. Reinténtalo más tarde.");
    }
    await deps.esperar(INTERVALO_SONDEO_MS);
  }

  const publicado = await llamarGraph(
    deps,
    `${base}/${cred.igUserId}/media_publish`,
    post({ creation_id: contenedor.id, access_token: cred.token })
  );
  if (!publicado.id) throw new Error("Instagram no confirmó la publicación.");

  // El permalink es un extra para enlazarlo en la app: si falla, el Reel ya está publicado.
  const permalink = await llamarGraph(deps, `${base}/${publicado.id}?fields=permalink&access_token=${token}`)
    .then((r) => r.permalink)
    .catch((e: unknown) => {
      console.warn("[Instagram] Reel publicado pero sin permalink:", e);
      return undefined;
    });

  return { publishedId: publicado.id, permalink };
}
