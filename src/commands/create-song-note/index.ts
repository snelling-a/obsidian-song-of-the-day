import { normalizePath, Notice, TFile, TFolder } from "obsidian";
import SongOfTheDayPlugin from "src/main";
import { SpotifyService } from "src/services/spotify";
import { SpotifyInputModal } from "src/ui/modal";
import { formatFileName } from "src/utils/format";

import { generateNoteBody } from "./generateNoteBody";
import { setFrontmatter } from "./setFrontmatter";

export const CREATE_SONG_NOTE_ID = "create-song-note";

/**
 * Registers the "Create Song of the Day Note" command with the plugin
 * @param plugin - The main plugin instance
 */
export function registerCreateSongNoteCommand(plugin: SongOfTheDayPlugin) {
  plugin.addCommand({
    callback: () => {
      const service = plugin.getSpotifyService();

      if (!service) {
        return;
      }

      new SpotifyInputModal(plugin.app, async (input) => {
        await createSongNote(plugin, service, input);
      }).open();
    },
    id: CREATE_SONG_NOTE_ID,
    name: "Create song note",
  });
}

/**
 * Creates a song note from a Spotify track link or ID
 * @param plugin - The main plugin instance
 * @param service - The Spotify service instance for API calls
 * @param input - Spotify track URL, URI, or track ID
 */
async function createSongNote(
  plugin: SongOfTheDayPlugin,
  service: SpotifyService,
  input: string,
) {
  try {
    const loadingNotice = new Notice("Fetching song data from Spotify...", 0);

    try {
      const trackId = service.extractTrackId(input);

      if (!trackId) {
        new Notice(
          "Invalid Spotify link or ID. Please provide a valid Spotify track URL, URI, or ID.",
        );

        return;
      }

      const track = await service.getTrack(trackId);

      const fileName =
        formatFileName(track.name, plugin.settings.noteNameFormat) + ".md";
      const folderPath = normalizePath(plugin.settings.outputFolder);
      const filePath = normalizePath(`${folderPath}/${fileName}`);

      const existingFile = plugin.app.vault.getAbstractFileByPath(filePath);

      if (existingFile instanceof TFile) {
        new Notice(`Note already exists: ${fileName}`);
        const leaf = plugin.app.workspace.getLeaf();

        await leaf.openFile(existingFile);

        return;
      }

      const folder = plugin.app.vault.getAbstractFileByPath(folderPath);

      if (!folder || !(folder instanceof TFolder)) {
        await plugin.app.vault.createFolder(folderPath);
      }

      const body = generateNoteBody(track, plugin);
      const file = await plugin.app.vault.create(filePath, body);

      await setFrontmatter(plugin, file, track);

      const leaf = plugin.app.workspace.getLeaf();

      await leaf.openFile(file);

      new Notice(`Created song note: ${track.name}`);
    } finally {
      loadingNotice.hide();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    new Notice(`Error: ${message}`);
    console.error("Song of the Day error:", error);
  }
}
