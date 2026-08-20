import { useState } from 'react';
import { Song, Setlist } from '../types';
import { formatSongShareText, formatSetlistShareText } from '../utils/shareUtils';

export function useShareModal(songs: Song[], bName: string) {
 const [shareModalData, setShareModalData] = useState<{
   isOpen: boolean;
   title: string;
   subtitle?: string;
   text: string;
   itemType: 'song' | 'setlist';
 }>({
   isOpen: false,
   title: '',
   text: '',
   itemType: 'setlist'
 });

 const handleShareSetlist = (setlist: Setlist) => {
   const songsMap: Record<string, Song> = Object.fromEntries(songs.map(s => [s.id, s]));
   setShareModalData({
     isOpen: true,
     title: setlist.nombre,
     subtitle: `Repertorio (${setlist.items.length} elementos) para WhatsApp`,
     text: formatSetlistShareText(setlist, songsMap, bName),
     itemType: 'setlist'
   });
 };

 const handleShareSong = (song: Song) => {
   setShareModalData({
     isOpen: true,
     title: song.titulo,
     subtitle: 'Compartir canción por WhatsApp',
     text: formatSongShareText(song, { includeChords: true, includeGuide: true }),
     itemType: 'song'
   });
 };

  return {
    shareModalData, setShareModalData,
    handleShareSetlist,
    handleShareSong,
  };
}
