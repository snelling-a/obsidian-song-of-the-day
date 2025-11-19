import { moment, normalizePath, Notice, TFile, TFolder } from "obsidian";
import { Track } from "src/types/spotify";

import type SongOfTheDayPlugin from "../main";

import { TEMPLATE_VARIABLES } from "../constants/template-variables";
import { SpotifyService } from "../services/spotify";
import { SpotifyInputModal } from "../ui/modal";
import { formatFileName } from "../utils/format";

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
    id: "create-song-note",
    name: "Create Song of the Day Note",
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    new Notice(`Error: ${message}`);
    console.error("Song of the Day error:", error);
  }
}

/**
 * Generates the note body using the template and track data.
 * Replaces all template variables with their corresponding values.
 * @param track - The Spotify track data
 * @param plugin - The main plugin instance containing settings
 * @returns The rendered note content with all template variables replaced
 */
function generateNoteBody(track: Track, plugin: SongOfTheDayPlugin): string {
  let body = plugin.settings.noteTemplate;

  for (const variable of TEMPLATE_VARIABLES) {
    const pattern = new RegExp(`\\{\\{${variable.name}\\}\\}`, "g");
    const value = variable.getValue(track, plugin);

    body = body.replace(pattern, value);
  }

  return body;
}

/**
 * Sets the frontmatter metadata for the song note
 * @param plugin - The main plugin instance containing settings
 * @param file - The created note file to add metadata to
 * @param track - The Spotify track data to extract metadata from
 */
async function setFrontmatter(
  plugin: SongOfTheDayPlugin,
  file: TFile,
  track: Track,
): Promise<void> {
  const artists = track.artists.map((a) => a.name);
  const coverImage = track.album.images[0]?.url || "";
  const createdDate = moment().format(plugin.settings.dateFormat);

  await plugin.app.fileManager.processFrontMatter(
    file,
    (frontmatter: Record<string, unknown>) => {
      frontmatter.title = track.name;
      frontmatter.artist = artists;
      frontmatter.album = track.album.name;
      frontmatter.release_date = track.album.release_date;
      frontmatter.date = createdDate;
      frontmatter.cover = coverImage;
      frontmatter.spotify_url = track.external_urls.spotify;
      frontmatter.spotify_id = track.id;
      frontmatter.duration_ms = track.duration_ms;
    },
  );
}
