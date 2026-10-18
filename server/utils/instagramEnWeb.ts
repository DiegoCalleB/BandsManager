/**
 * Cuentas de Instagram que enlaza una página web, y cuál es la de la sala.
 *
 * Una web de sala suele enlazar a varias cuentas (patrocinadores, la promotora, el perfil de un músico del cartel): la
 * primera no tiene por qué ser la suya. Con el nombre de la sala se elige la que se le parece; si ninguna, ninguna,
 * porque un perfil que no es de la sala puede ser de una persona.
 */
import { instagramDeLaSala } from './salaCatalogo.js';

const RESERVADOS = new Set(['p', 'reel', 'reels', 'stories', 'explore', 'accounts', 'privacy', 'legal', 'about', 'help', 'terms', 'direct', 'login', 'signup', 'developer', 'static', 'tv', 'web']);

/** Usuarios de Instagram enlazados en el HTML, sin repetir y sin las rutas que no son perfiles. */
export function usuariosDeInstagram(html: string): string[] {
  const vistos = new Set<string>();
  for (const m of html.matchAll(/https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9_.-]+)\/?/gi)) {
    const usuario = m[1].replace(/^@/, '');
    if (!RESERVADOS.has(usuario.toLowerCase())) vistos.add(usuario);
  }
  return [...vistos];
}

/** `@usuario` de la sala entre los candidatos, o undefined. Sin nombre de sala no hay con qué comparar: el primero. */
export function elegirInstagram(candidatos: readonly string[], nombreSala?: string): string | undefined {
  const elegido = nombreSala ? candidatos.find((c) => instagramDeLaSala(c, nombreSala)) : candidatos[0];
  return elegido ? `@${elegido}` : undefined;
}
