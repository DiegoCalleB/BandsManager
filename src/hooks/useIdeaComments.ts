import { useState } from 'react';
import { Song, SongAudioIdea, AudioComment } from '../types';

/** Comentarios con marca de tiempo sobre una idea de audio de una canción. */
export function useIdeaComments(
  song: Song,
  onUpdateSong: (updatedSong: Song) => void,
  currentUsername: string,
  currentTimeMap: Record<string, number>
) {
  // Comment input state
  const [commentTextMap, setCommentTextMap] = useState<Record<string, string>>({});
  const [commentTimeTagMap, setCommentTimeTagMap] = useState<Record<string, number | null>>({});
  const [commentTrackTagMap, setCommentTrackTagMap] = useState<Record<string, string | null>>({});

  // Add Comment
  const handleAddComment = (idea: SongAudioIdea) => {
    const text = commentTextMap[idea.id];
    if (!text || !text.trim()) return;

    const timeTag = commentTimeTagMap[idea.id] !== undefined ? commentTimeTagMap[idea.id] : undefined;
    const trackTag = commentTrackTagMap[idea.id] || undefined;

    const newComment: AudioComment = {
      id: `comment-${Date.now()}`,
      autor: currentUsername,
      instrumento: trackTag,
      timestampSegundos: timeTag ?? Math.floor(currentTimeMap[idea.id] || 0),
      texto: text.trim(),
      fecha: 'Ahora',
    };

    const updatedIdeas = (song.audioIdeas || []).map((i) => {
      if (i.id === idea.id) {
        return {
          ...i,
          comentarios: [...(i.comentarios || []), newComment],
        };
      }
      return i;
    });

    onUpdateSong({ ...song, audioIdeas: updatedIdeas });

    setCommentTextMap((prev) => ({ ...prev, [idea.id]: '' }));
    setCommentTimeTagMap((prev) => ({ ...prev, [idea.id]: null }));
    setCommentTrackTagMap((prev) => ({ ...prev, [idea.id]: null }));
  };

  return {
    commentTextMap,
    setCommentTextMap,
    commentTimeTagMap,
    setCommentTimeTagMap,
    commentTrackTagMap,
    setCommentTrackTagMap,
    handleAddComment,
  };
}
