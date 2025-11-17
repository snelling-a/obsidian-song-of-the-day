import { NoteNameFormat } from "./constants/settings";

export interface SongOfTheDaySettings {
  dateFormat: string;
  noteNameFormat: NoteNameFormat;
  noteTemplate: string;
  outputFolder: string;
  spotifyClientId: string;
  spotifyClientSecret: string;
}

export interface SpotifyTrack {
  album: {
    images: Array<{ height: number; url: string; width: number }>;
    name: string;
    release_date: string;
    release_date_precision: "day" | "month" | "year";
  };
  artists: Array<{ id: string; name: string }>;
  duration_ms: number;
  external_urls?: {
    spotify: string;
  };
  id: string;
  name: string;
}
