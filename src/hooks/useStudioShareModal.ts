import { useState } from 'react';
import { Song, SongAudioIdea } from '../types';
import { formatSongShareText, formatSongIdeaShareText } from '../utils/shareUtils';

export function useStudioShareModal(song: Song) {
  const [shareModalData, setShareModalData] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    text: string;
    itemType: 'song' | 'idea';
  }>({
    isOpen: false,
    title: '',
    text: '',
    itemType: 'song'
  });

  const handleShareSong = () => {
    setShareModalData({
      isOpen: true,
      title: song.titulo,
      subtitle: 'Compartir canción por WhatsApp',
      text: formatSongShareText(song, { includeChords: true, includeGuide: true }),
      itemType: 'song'
    });
  };

  const handleShareIdea = (idea: SongAudioIdea) => {
    setShareModalData({
      isOpen: true,
      title: `${song.titulo} - Idea: ${idea.titulo}`,
      subtitle: `Idea de audio (${idea.seccion}) de ${idea.subidoPor}`,
      text: formatSongIdeaShareText(song, idea),
      itemType: 'idea'
    });
  };

  return {
    shareModalData, setShareModalData,
    handleShareSong,
    handleShareIdea,
  };
}
