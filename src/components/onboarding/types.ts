import { EPKConfig, BandMember, EPKVideo, Song, Concert, Rehearsal, User } from' ../../types';

export interface SpotifyTrack {
 id: string;
 name: string;
 trackNumber: number;
 durationFormatted: string;
 previewUrl: string | null;
 spotifyUrl: string;
}

export interface SpotifyAlbum {
 id: string;
 name: string;
 albumType:' album' |' single' |' compilation';
 releaseYear: string;
 totalTracks: number;
 coverUrl: string;
 spotifyUrl: string;
 tracks: SpotifyTrack[];
}

export interface SpotifyArtist {
 id: string;
 name: string;
 genres: string[];
 followers: number;
 popularity: number;
 imageUrl: string;
 spotifyUrl: string;
}

export interface QuickEventItem {
 id: string;
 tipo:' concierto' |' festival' |' ensayo' |' privado';
 titulo: string;
 fecha: string;
 hora: string;
 ciudad: string;
 lugar: string;
 enlaceEntradas?: string;
 precioEntrada?: number;
}

export interface ManualSongItem {
 id: string;
 titulo: string;
 tonalidad: string;
 bpm: number;
 duracion: string;
 album: string;
}

export interface PressQuoteItem {
 id: string;
 texto: string;
 medio: string;
}

export interface WizardMemberItem {
 id: string;
 name: string;
 role: string;
 email: string;
 instagram: string;
 isLeader?: boolean;
}

export interface WizardStepDef {
 key: string;
 title: string;
 shortTitle: string;
 iconName: string;
 description: string;
}
