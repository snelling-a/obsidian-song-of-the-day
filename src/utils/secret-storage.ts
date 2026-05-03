import SongOfTheDayPlugin from "main";

/**
 * Retrieves the Spotify Client Id from Obsidian's secret storage.
 * @param plugin The plugin instance to access Obsidian's secret storage and settings
 * @returns The Spotify Client Id from Obsidian's secret storage, or null if not set
 */
export function getClientId(plugin: SongOfTheDayPlugin): null | string {
  return plugin.app.secretStorage.getSecret(plugin.settings.spotifyClientId);
}

/**
 * Retrieves the Spotify Client Secret from Obsidian's secret storage.
 * @param plugin The plugin instance to access Obsidian's secret storage and settings
 * @returns The Spotify Client Secret from Obsidian's secret storage, or null if not set
 */
export function getClientSecret(plugin: SongOfTheDayPlugin): null | string {
  return plugin.app.secretStorage.getSecret(
    plugin.settings.spotifyClientSecret,
  );
}
