/**
 * Aviso discreto en las páginas públicas de SEO cuando el idioma del navegador no es el de la página:
 * «Read this page in English» / «Leer en español». No redirige nunca (un rastreador o un enlace compartido
 * deben ver lo mismo que cualquiera), no depende de cabeceras (la página sigue siendo cacheable) y se puede cerrar.
 * La decisión se toma en el navegador con la misma función que la app (`src/utils/idiomaNavegador.ts`).
 */
import { escapeHtml } from '../html.js';
import { idiomaSugerido } from '../../../src/utils/idiomaNavegador.js';
import type { IdiomaSeo } from './rutas.js';

const TEXTO: Record<IdiomaSeo, { mensaje: string; enlace: string; cerrar: string }> = {
  // El aviso va en el idioma al que invita a cambiar, que es el que entiende quien lo ve.
  en: { mensaje: 'Esta página también está disponible en español.', enlace: 'Leer en español', cerrar: 'Cerrar aviso' },
  es: { mensaje: 'This page is also available in English.', enlace: 'Read in English', cerrar: 'Dismiss' },
};

/** Clave de `localStorage` con la que se recuerda que el visitante ya cerró el aviso o eligió idioma. */
export const CLAVE_AVISO = 'bm_idioma_aviso';
/** La que usa la app (`LanguageContext`) para el idioma elegido: al aceptar el aviso se alinean las dos. */
export const CLAVE_IDIOMA_APP = 'bandmanager_language';

/** Script del aviso. Se construye con la función de la app para que haya una sola fuente de verdad. */
export function scriptAvisoIdioma(idiomaPagina: IdiomaSeo): string {
  const otro: IdiomaSeo = idiomaPagina === 'es' ? 'en' : 'es';
  return `(function(){${`var idiomaSugerido=${idiomaSugerido.toString()};`}try{var b=document.getElementById('aviso-idioma');if(!b)return;var p=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language];if(idiomaSugerido(p)===${JSON.stringify(idiomaPagina)}||localStorage.getItem(${JSON.stringify(CLAVE_AVISO)}))return;b.hidden=false;var recordar=function(){try{localStorage.setItem(${JSON.stringify(CLAVE_AVISO)},'1')}catch(e){/*sin almacenamiento*/}};b.querySelector('a').addEventListener('click',function(){recordar();try{localStorage.setItem(${JSON.stringify(CLAVE_IDIOMA_APP)},${JSON.stringify(otro)})}catch(e){/*sin almacenamiento*/}});b.querySelector('button').addEventListener('click',function(){recordar();b.hidden=true})}catch(e){/*el aviso es opcional*/}})();`;
}

export function avisoIdiomaHtml(base: string, idiomaPagina: IdiomaSeo, hrefOtroIdioma: string): string {
  const t = TEXTO[idiomaPagina];
  const otro: IdiomaSeo = idiomaPagina === 'es' ? 'en' : 'es';
  return `<div id="aviso-idioma" class="aviso-idioma no-imprimir" hidden role="note"><span>${escapeHtml(t.mensaje)} <a lang="${otro}" hreflang="${otro}" href="${escapeHtml(base)}${escapeHtml(hrefOtroIdioma)}">${escapeHtml(t.enlace)}</a></span><button type="button" aria-label="${escapeHtml(t.cerrar)}">×</button></div><script>${scriptAvisoIdioma(idiomaPagina)}</script>`;
}
