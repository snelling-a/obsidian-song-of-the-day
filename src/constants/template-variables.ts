import SongOfTheDayPlugin from "main";
import { Track } from "src/services/spotify/types";

import { FIELD_REGISTRY } from "./field-registry";

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
   * @param track The Spotify track data
   * @param plugin The plugin instance (for accessing settings like dateFormat)
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
 * Generated from FIELD_REGISTRY.
 */
export const TEMPLATE_VARIABLES: TemplateVariable[] = FIELD_REGISTRY.map(
  field => ({
    description: field.description,
    getValue: field.getValue,
    name: field.key,
  }),
);
