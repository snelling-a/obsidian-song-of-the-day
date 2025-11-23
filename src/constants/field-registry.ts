import SongOfTheDayPlugin from "main";
import { moment } from "obsidian";
import { Track } from "src/services/spotify/types";

/**
 * Definition for a frontmatter/template field.
 */
export interface FieldDefinition {
  /**
   * Whether this field is enabled by default
   */
  defaultEnabled: boolean;

  /**
   * Description for template variable help text
   */
  description: string;

  /**
   * Function to extract/format the value from track data
   * @param track The Spotify track data
   * @param plugin The plugin instance (for accessing settings)
   * @returns The formatted value
   */
  getValue: (track: Track, plugin: SongOfTheDayPlugin) => string;

  /**
   * Unique field key (used in frontmatter and settings)
   */
  key: string;

  /**
   * User-friendly label for settings UI
   */
  label: string;
}

/**
 * Registry of all available fields.
 * This is the single source of truth for frontmatter fields and template variables.
 * Adding a new field here automatically makes it available throughout the plugin.
 */
export const FIELD_REGISTRY: FieldDefinition[] = [
  {
    defaultEnabled: true,
    description: "Track title",
    getValue: track => track.name,
    key: "title",
    label: "Title",
  },
  {
    defaultEnabled: true,
    description: "Artist name(s), comma-separated",
    getValue: track => track.artists.map(a => a.name).join(", "),
    key: "artist",
    label: "Artist",
  },
  {
    defaultEnabled: true,
    description: "Album name",
    getValue: track => track.album.name,
    key: "album",
    label: "Album",
  },
  {
    defaultEnabled: true,
    description: "Album release date",
    getValue: track => track.album.release_date,
    key: "release_date",
    label: "Release date",
  },
  {
    defaultEnabled: true,
    description: "Note creation date (uses date format setting)",
    getValue: (_track, plugin) => moment().format(plugin.settings.dateFormat),
    key: "date",
    label: "Date created",
  },
  {
    defaultEnabled: true,
    description: "Album cover image URL",
    getValue: track => track.album.images[0]?.url || "",
    key: "cover",
    label: "Cover image",
  },
  {
    defaultEnabled: true,
    description: "Spotify track URL",
    getValue: track => track.external_urls.spotify,
    key: "spotify_url",
    label: "Spotify URL",
  },
  {
    defaultEnabled: true,
    description: "Spotify track ID",
    getValue: track => track.id,
    key: "spotify_id",
    label: "Spotify ID",
  },
  {
    defaultEnabled: true,
    description: "Track duration in milliseconds",
    getValue: track => String(track.duration_ms),
    key: "duration_ms",
    label: "Duration (ms)",
  },
  {
    defaultEnabled: false,
    description: "Track duration in mm:ss format",
    getValue: (track): string => {
      const minutes = Math.floor(track.duration_ms / 60000);
      const seconds = Math.floor((track.duration_ms % 60000) / 1000);
      const paddedSeconds = seconds.toString().padStart(2, "0");

      return `${minutes.toString()}:${paddedSeconds}`;
    },
    key: "duration",
    label: "Duration (formatted)",
  },
];
