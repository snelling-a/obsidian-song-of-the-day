import SongOfTheDayPlugin from "main";
import { normalizePath, Notice, TFile, TFolder } from "obsidian";
import { Track } from "src/services/spotify/types";

import { FIELD_REGISTRY } from "../constants/field-registry";
import { TEMPLATE_VARIABLES } from "../constants/template-variables";
import { SpotifyService } from "../services/spotify";
import { SpotifyInputModal } from "../ui/modal";
import { formatFileName } from "../utils/format";

/**
 * Registers the "Create song note" command in Obsidian.
 */
export function registerCreateSongNoteCommand(
  plugin: SongOfTheDayPlugin,
): void {
  plugin.addCommand({
    callback: () => {
      const service = plugin.getSpotifyService();
      if (!service) {
        return;
      }

      new SpotifyInputModal(plugin.app, (input) => {
        void createSongNote(plugin, service, input);
      }).open();
    },
    id: "create-song-note",
    name: "Create song note",
  });
}

/**
 * Adds a track to the configured Spotify playlist.
 * Checks local cache to prevent duplicates.
 */
async function addTrackToPlaylist(
  plugin: SongOfTheDayPlugin,
  service: SpotifyService,
  track: Track,
): Promise<void> {
  try {
    if (!service.isUserAuthenticated()) {
      new Notice(
        "Not authenticated with Spotify. Authenticate in settings to add songs to playlist.",
      );

      return;
    }

    if (plugin.settings.addedTrackIds.includes(track.id)) {
      new Notice("Song already in playlist");

      return;
    }

    const trackUri = `spotify:track:${track.id}`;
    await service.addTrackToPlaylist(plugin.settings.playlistId, trackUri);

    // Re-check before mutating to prevent race conditions
    if (!plugin.settings.addedTrackIds.includes(track.id)) {
      plugin.settings.addedTrackIds.push(track.id);
      await plugin.saveSettings();
    }

    new Notice("Added to playlist");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    new Notice(`Failed to add to playlist: ${message}`);
    console.error("Failed to add track to playlist:", error);
  }
}

/**
 * Creates a song note from a Spotify track link or ID.
 */
async function createSongNote(
  plugin: SongOfTheDayPlugin,
  service: SpotifyService,
  input: string,
): Promise<void> {
  try {
    const loadingNotice = new Notice("Fetching song data from Spotify", 0);

    try {
      const trackId = service.extractTrackId(input);
      if (!trackId) {
        new Notice(
          "Invalid Spotify link or ID. Provide a valid Spotify track URL, URI, or ID.",
        );

        return;
      }

      const track = await service.getTrack(trackId);

      const artistName = track.artists[0]?.name ?? "Unknown Artist";
      const fileName = `${formatFileName(
        track.name,
        artistName,
        plugin.settings.noteNameStructure,
        plugin.settings.noteNameCasing,
      )}.md`;
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
        try {
          await plugin.app.vault.createFolder(folderPath);
        } catch (error) {
          // Folder might already exist with different casing on case-insensitive filesystems
          if (
            error instanceof Error
            && !error.message.includes("Folder already exists")
          ) {
            throw error;
          }
        }
      }

      const body = generateNoteBody(track, plugin);
      const file = await plugin.app.vault.create(filePath, body);

      await setFrontmatter(plugin, file, track);

      const leaf = plugin.app.workspace.getLeaf();
      await leaf.openFile(file);

      new Notice(`Created note: ${track.name}`);

      if (plugin.settings.playlistId) {
        await addTrackToPlaylist(plugin, service, track);
      }
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
function generateNoteBody(track: Track, plugin: SongOfTheDayPlugin): string {
  let body = plugin.settings.noteTemplate;

  for (const variable of TEMPLATE_VARIABLES) {
    const pattern = new RegExp(String.raw`\{\{${variable.name}\}\}`, "g");
    const value = variable.getValue(track, plugin);
    body = body.replace(pattern, value);
  }

  return body;
}

/**
 * Sets the frontmatter metadata for the song note.
 */
async function setFrontmatter(
  plugin: SongOfTheDayPlugin,
  file: TFile,
  track: Track,
): Promise<void> {
  await plugin.app.fileManager.processFrontMatter(
    file,
    (frontmatter: Record<string, unknown>) => {
      for (const field of FIELD_REGISTRY) {
        if (plugin.settings.frontmatterFields[field.key]) {
          frontmatter[field.key] = field.getValue(track, plugin);
        }
      }
    },
  );
}
