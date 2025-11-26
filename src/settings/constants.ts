import { moment } from "obsidian";
import { FIELD_REGISTRY } from "src/constants/field-registry";

import { FrontmatterFields, SongOfTheDaySettings } from "./types";

export const NOTE_NAME_STRUCTURE = {
  ARTIST_SONG: "artist-song",
  SONG_ARTIST: "song-artist",
  SONG_ONLY: "song-only",
} as const;

export const NOTE_NAME_CASING = {
  KEBAB_CASE: "kebab-case",
  ORIGINAL: "original",
  SNAKE_CASE: "snake_case",
} as const;

export const SPOTIFY_API_DOCS_URL
  = "https://developer.spotify.com/documentation/web-api/concepts/apps";

export const MOMENT_FORMAT_DOCS_URL
  = "https://momentjs.com/docs/#/displaying/format/";

/**
 * Generates default frontmatter fields from the field registry.
 * @returns Default frontmatter fields configuration
 */
function getDefaultFrontmatterFields(): FrontmatterFields {
  const fields: FrontmatterFields = {};
  for (const field of FIELD_REGISTRY) {
    fields[field.key] = field.defaultEnabled;
  }

  return fields;
}

export const DEFAULT_SETTINGS: SongOfTheDaySettings = {
  addedTrackIds: [],
  dateFormat: moment.HTML5_FMT.DATE,
  frontmatterFields: getDefaultFrontmatterFields(),
  noteNameCasing: NOTE_NAME_CASING.ORIGINAL,
  noteNameStructure: NOTE_NAME_STRUCTURE.SONG_ONLY,
  noteTemplate: "# {{title}}\n\n",
  outputFolder: "",
  playlistId: "",
  spotifyAccessToken: "",
  spotifyClientId: "",
  spotifyClientSecret: "",
  spotifyRefreshToken: "",
  spotifyTokenExpiry: 0,
};
