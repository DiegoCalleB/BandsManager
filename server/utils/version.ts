// Versión de la aplicación (SemVer). Única fuente de verdad: `version` de package.json, que mantiene
// release-please (ver AGENTS.md §7.6) - no se edita a mano. Se lee en runtime porque el servidor se
// despliega con package.json al lado; si no se puede leer, devuelve "desconocida" en vez de fallar.
import fs from "fs";
import path from "path";

let cache: { version: string; commit: string | null } | null = null;

export function getAppInfo(): { version: string; commit: string | null } {
  if (cache) return cache;
  let version = "desconocida";
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));
    if (typeof pkg.version === "string") version = pkg.version;
  } catch {
    // sin package.json legible: la versión no es crítica para arrancar
  }
  // Railway inyecta el SHA del despliegue; sirve para distinguir dos builds de la misma versión.
  const sha = process.env.RAILWAY_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || "";
  cache = { version, commit: sha ? sha.slice(0, 7) : null };
  return cache;
}

/** Identificador de release para Sentry: `bandmanager@0.1.0`. */
export function sentryRelease(): string {
  return `bandmanager@${getAppInfo().version}`;
}
