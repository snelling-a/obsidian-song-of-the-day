import { FIELD_REGISTRY } from "src/constants/field-registry";

import { NOTE_NAME_CASING, NOTE_NAME_STRUCTURE } from "./constants";

/**
 * Frontmatter fields configuration.
 * Keys are generated from FIELD_REGISTRY.
 */
export type FrontmatterFields = Record<
  (typeof FIELD_REGISTRY)[number]["key"],
  boolean
>;

export type NoteNameCasing =
  (typeof NOTE_NAME_CASING)[keyof typeof NOTE_NAME_CASING];

export type NoteNameStructure =
  (typeof NOTE_NAME_STRUCTURE)[keyof typeof NOTE_NAME_STRUCTURE];

export interface SongOfTheDaySettings {
  addedTrackIds: string[];
  dateFormat: string;
  frontmatterFields: FrontmatterFields;
  noteNameCasing: NoteNameCasing;
  noteNameStructure: NoteNameStructure;
  noteTemplate: string;
  outputFolder: string;
  playlistId: string;
  spotifyAccessToken: string;

  /**
   * Spotify Client Id is stored in Obsidian's secret storage for security.
   * spotifyClientId holds the key to retrieve it, not the ID itself.
   */
  spotifyClientId: string;

  /**
   * Spotify Client Secret is stored in Obsidian's secret storage for security.
   * spotifyClientSecret holds the key to retrieve it, not the secret itself.
   */
  spotifyClientSecret: string;
  spotifyRefreshToken: string;
  spotifyTokenExpiry: number;
}
