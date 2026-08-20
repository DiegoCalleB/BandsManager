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
 return songs.filter(s => {
 const matchSearch = catalogSearch === '' || 
 s.titulo.toLowerCase().includes(catalogSearch.toLowerCase()) ||
 (s.tonalidad && s.tonalidad.toLowerCase().includes(catalogSearch.toLowerCase())) ||
 (s.notasInternas && s.notasInternas.toLowerCase().includes(catalogSearch.toLowerCase()));

 const matchAlbum = catalogAlbumFilter === 'todos' || s.albumDisco === catalogAlbumFilter;
 const matchStatus = catalogStatusFilter === 'todos' || s.estadoTema === catalogStatusFilter;

 return matchSearch && matchAlbum && matchStatus;
 });
 }, [songs, catalogSearch, catalogAlbumFilter, catalogStatusFilter]);

  return {
    groupByAlbum, setGroupByAlbum,
    catalogSearch, setCatalogSearch,
    catalogAlbumFilter, setCatalogAlbumFilter,
    catalogStatusFilter, setCatalogStatusFilter,
    albumsList,
    filteredSongs,
  };
}
