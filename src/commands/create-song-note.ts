import { moment, normalizePath, Notice, TFile, TFolder } from "obsidian";

import type SongOfTheDayPlugin from "../main";

import { TEMPLATE_VARIABLES } from "../constants/template-variables";
import { SpotifyService } from "../services/spotify";
import { SpotifyTrack } from "../types";
import { SpotifyInputModal } from "../ui/modal";
import { formatFileName } from "../utils/format";

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
 */
function generateNoteBody(
  track: SpotifyTrack,
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

/**
 * Sets the frontmatter metadata for the song note
 */
async function setFrontmatter(
  plugin: SongOfTheDayPlugin,
  file: TFile,
  track: SpotifyTrack,
): Promise<void> {
  const artists = track.artists.map((a) => a.name);
  const coverImage = track.album.images[0]?.url || "";
  const createdDate = moment().format(plugin.settings.dateFormat);

  await plugin.app.fileManager.processFrontMatter(file, (frontmatter) => {
    frontmatter.title = track.name;
    frontmatter.artist = artists;
    frontmatter.album = track.album.name;
    frontmatter.release_date = track.album.release_date;
    frontmatter.date = createdDate;
    frontmatter.cover = coverImage;
    frontmatter.spotify_url = track.external_urls?.spotify ?? "";
    frontmatter.spotify_id = track.id;
    frontmatter.duration_ms = track.duration_ms;
  });
}
