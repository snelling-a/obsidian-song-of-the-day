import { TEMPLATE_VARIABLES } from "src/constants/template-variables";
import SongOfTheDayPlugin from "src/main";
import { Track } from "src/types/spotify";

/**
 * Generates the note body using the template and track data.
 * Replaces all template variables with their corresponding values.
 * @param track - The Spotify track data
 * @param plugin - The main plugin instance containing settings
 * @returns The rendered note content with all template variables replaced
 */
export function generateNoteBody(
  track: Track,
  plugin: SongOfTheDayPlugin,
): string {
  let body = plugin.settings.noteTemplate;

  for (const variable of TEMPLATE_VARIABLES) {
    const pattern = new RegExp(`\\{\\{${variable.name}\\}\\}`, "g");
    const value = variable.getValue(track, plugin);

    body = body.replace(pattern, value);
  }

  return body;
}
