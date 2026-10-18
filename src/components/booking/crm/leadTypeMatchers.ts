/**
 * Clasificadores de tipo de lead para las secciones Medios y Grupos del CRM de booking.
 * Funciones puras sobre el tipo/etiqueta del lead: viven fuera de la pantalla para poder probarlas.
 */
import type { Lead } from "../../../types";
import { normalizeType } from "../../../utils/bookingUtils";

export const matchesMedioType = (l: Lead, filter: string): boolean => {
  if (!filter || filter === 'todos') return true;
  const txt =
    `${l.genero || ''} ${l.nombre_sala || ''} ${l.tipo || ''} ${l.icono || ''} ${l.notas || ''} ${l.contexto_extra || ''}`.toLowerCase();
  if (filter === 'radio')
    return (
      txt.includes('radio') ||
      txt.includes('emisora') ||
      txt.includes('fm') ||
      txt.includes('am') ||
      txt.includes('ser') ||
      txt.includes('cope') ||
      txt.includes('ondacero') ||
      txt.includes('📻')
    );
  if (filter === 'tv' || filter === 'television')
    return (
      txt.includes('tv') ||
      txt.includes('televis') ||
      txt.includes('rtv') ||
      txt.includes('tele') ||
      txt.includes('canal') ||
      txt.includes('📺')
    );
  if (filter === 'prensa')
    return (
      txt.includes('prensa') ||
      txt.includes('revista') ||
      txt.includes('periódico') ||
      txt.includes('periodico') ||
      txt.includes('diario') ||
      txt.includes('blog') ||
      txt.includes('magazine') ||
      txt.includes('fanzine') ||
      txt.includes('web') ||
      txt.includes('noticias') ||
      txt.includes('redacción') ||
      txt.includes('redaccion') ||
      txt.includes('📰')
    );
  if (filter === 'redes')
    return (
      txt.includes('redes') ||
      txt.includes('social') ||
      txt.includes('instagram') ||
      txt.includes('youtube') ||
      txt.includes('tiktok') ||
      txt.includes('twitter') ||
      txt.includes('influencer') ||
      txt.includes('creador') ||
      txt.includes('📱')
    );
  if (filter === 'podcast' || filter === 'podcasts')
    return (
      txt.includes('podcast') ||
      txt.includes('entrevista') ||
      txt.includes('ivoox') ||
      txt.includes('spotify') ||
      txt.includes('audio') ||
      txt.includes('🎙️')
    );
  return true;
};

export const matchesGruposType = (l: Lead, filter: string): boolean => {
  if (!filter || filter === 'todos') return true;
  const norm = normalizeType(l.tipo);
  if (norm === filter) return true;
  const txt =
    `${l.genero || ''} ${l.nombre_sala || ''} ${l.tipo || ''} ${l.icono || ''} ${l.notas || ''} ${l.contexto_extra || ''}`.toLowerCase();
  if (filter === 'grupo')
    return (
      norm === 'grupo' ||
      txt.includes('grupo') ||
      txt.includes('banda') ||
      txt.includes('artista') ||
      txt.includes('co-booking') ||
      txt.includes('músico') ||
      txt.includes('musico') ||
      txt.includes('🎸')
    );
  if (filter === 'agencia')
    return (
      norm === 'agencia' ||
      txt.includes('agencia') ||
      txt.includes('agency') ||
      txt.includes('booking') ||
      txt.includes('promotora') ||
      txt.includes('💼')
    );
  if (filter === 'manager')
    return (
      norm === 'manager' ||
      txt.includes('manager') ||
      txt.includes('mánager') ||
      txt.includes('management') ||
      txt.includes('representante') ||
      txt.includes('👔')
    );
  if (filter === 'productora')
    return (
      norm === 'productora' ||
      txt.includes('productora') ||
      txt.includes('producciones') ||
      txt.includes('production') ||
      txt.includes('eventos') ||
      txt.includes('🎬')
    );
  if (filter === 'sello')
    return (
      norm === 'sello' ||
      txt.includes('sello') ||
      txt.includes('discográfica') ||
      txt.includes('discografica') ||
      txt.includes('record') ||
      txt.includes('label') ||
      txt.includes('💿')
    );
  return true;
};
