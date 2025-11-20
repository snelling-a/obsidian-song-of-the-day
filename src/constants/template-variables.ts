import { Track } from "src/types/spotify";

import type SongOfTheDayPlugin from "../main";

/**
 * Template variable definition for note templates.
 */
export interface TemplateVariable {
  /**
   * User-friendly description for settings UI
   */
  description: string;
  /**
   * Function to extract/format the value from track data
   * @param track - The Spotify track data
   * @param plugin - The plugin instance (for accessing settings like dateFormat)
   * @returns The formatted value to replace the template variable
   */
  getValue: (track: Track, plugin: SongOfTheDayPlugin) => string;
  /**
   * Variable name (without braces, e.g., "title")
   */
  name: string;
}

/**
 * All available template variables for note templates.
 * Add new variables here to make them available in templates.
 */
export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  {
    description: "Track title",
    getValue: (track) => track.name,
    name: "title",
  },
  {
    description: "Artist name(s), comma-separated",
    getValue: (track) => track.artists.map((a) => a.name).join(", "),
    name: "artist",
  },
  {
    description: "Album name",
    getValue: (track) => track.album.name,
    name: "album",
  },
  {
    description: "Album release date",
    getValue: (track) => track.album.release_date,
    name: "release_date",
  },
  {
    description: "Spotify track URL",
    getValue: (track) => track.external_urls.spotify,
    name: "spotify_url",
  },
];

/**
 * Creates a DocumentFragment with formatted template variable documentation.
 * Each variable is displayed as code with its description, aligned in columns.
 * @param el - The DocumentFragment to populate
 */
export function createTemplateVariablesFragment(el: DocumentFragment): void {
  el.appendText("Template for note body. Available variables:");
  const variablesContainer = el.createDiv();

  variablesContainer.setCssProps({ "margin-top": "0.5em" });

  for (const variable of TEMPLATE_VARIABLES) {
    const row = variablesContainer.createDiv();

    row.setCssProps({
      "align-items": "baseline",
      display: "flex",
      gap: "0.5em",
    });

    const code = row.createEl("code", { text: `{{${variable.name}}}` });

    code.setCssProps({
      display: "inline-block",
      "min-width": "130px",
    });

    row.appendText(variable.description);
  }
}
