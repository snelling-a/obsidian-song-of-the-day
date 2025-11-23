import SongOfTheDayPlugin from "main";

import { registerCreateSongNoteCommand } from "./create-song-note";

/**
 * Registers all plugin commands.
 * @param plugin Plugin instance
 */
export function registerCommands(plugin: SongOfTheDayPlugin): void {
  registerCreateSongNoteCommand(plugin);
}
