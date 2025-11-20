import { moment } from "obsidian";
import { SongOfTheDaySettings } from "src/types/settings";

export const NOTE_NAME_FORMAT = {
  KEBAB_CASE: "kebab-case",
  ORIGINAL: "original",
  SNAKE_CASE: "snake_case",
} as const;

export type NoteNameFormat =
  (typeof NOTE_NAME_FORMAT)[keyof typeof NOTE_NAME_FORMAT];

export const SPOTIFY_API_DOCS_URL =
  "https://developer.spotify.com/documentation/web-api/concepts/apps";

export const MOMENT_FORMAT_DOCS_URL =
  "https://momentjs.com/docs/#/displaying/format/";

export const DEFAULT_SETTINGS: SongOfTheDaySettings = {
  dateFormat: moment.HTML5_FMT.DATE,
  noteNameFormat: NOTE_NAME_FORMAT.ORIGINAL,
  noteTemplate: "# {{title}}\n\n",
  outputFolder: "",
  spotifyClientId: "",
  spotifyClientSecret: "",
};
