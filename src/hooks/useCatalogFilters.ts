import { useState, useMemo } from 'react';
import { Song } from '../types';

export function useCatalogFilters(songs: Song[]) {
  const [groupByAlbum, setGroupByAlbum] = useState(false);
 const [catalogSearch, setCatalogSearch] = useState('');
 const [catalogAlbumFilter, setCatalogAlbumFilter] = useState<string>('todos');
 const [catalogStatusFilter, setCatalogStatusFilter] = useState<string>('todos');

 const albumsList = useMemo(() => {
 if (!Array.isArray(songs)) return ['todos', 'Singles / Sin Disco'];
 const safe = songs.filter((s): s is Song => Boolean(s && typeof s === 'object' && s.id));
 const list = safe
 .map((s) => s.albumDisco || s.album)
 .filter((a): a is string => Boolean(a && typeof a === 'string'));
 const albumSet = new Set(list);
 if (safe.some((s) => !s.albumDisco && !s.album) || albumSet.size === 0) {
 albumSet.add('Singles / Sin Disco');
 }
 return ['todos', ...Array.from(albumSet)];
 }, [songs]);

 // Filtered catalog songs
 const filteredSongs = useMemo(() => {
 const filtered = songs.filter(s => {
 const matchSearch = catalogSearch === '' ||
 s.titulo.toLowerCase().includes(catalogSearch.toLowerCase()) ||
 (s.tonalidad && s.tonalidad.toLowerCase().includes(catalogSearch.toLowerCase())) ||
 (s.notasInternas && s.notasInternas.toLowerCase().includes(catalogSearch.toLowerCase()));

 const matchAlbum = catalogAlbumFilter === 'todos' || s.albumDisco === catalogAlbumFilter;
 const matchStatus = catalogStatusFilter === 'todos'
 || (catalogStatusFilter === 'favoritos' ? Boolean(s.favoritoGeneral) : s.estadoTema === catalogStatusFilter);

 return matchSearch && matchAlbum && matchStatus;
 });

 if (!groupByAlbum) return filtered;

 // Group visually by album: sort by album name (Singles last), then by track order within it
 return [...filtered].sort((a, b) => {
 const albumA = a.albumDisco || a.album || '';
 const albumB = b.albumDisco || b.album || '';
 if (albumA !== albumB) {
 if (!albumA) return 1;
 if (!albumB) return -1;
 return albumA.localeCompare(albumB);
 }
 return (a.ordenAlbum ?? 0) - (b.ordenAlbum ?? 0);
 });
 }, [songs, catalogSearch, catalogAlbumFilter, catalogStatusFilter, groupByAlbum]);

  return {
    groupByAlbum, setGroupByAlbum,
    catalogSearch, setCatalogSearch,
    catalogAlbumFilter, setCatalogAlbumFilter,
    catalogStatusFilter, setCatalogStatusFilter,
    albumsList,
    filteredSongs,
  };
}
