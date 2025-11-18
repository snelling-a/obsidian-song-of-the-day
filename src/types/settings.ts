import { NoteNameFormat } from "src/constants/settings";

export interface SongOfTheDaySettings {
  dateFormat: string;
  noteNameFormat: NoteNameFormat;
  noteTemplate: string;
  outputFolder: string;
  spotifyClientId: string;
  spotifyClientSecret: string;
}
