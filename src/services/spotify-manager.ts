import type { App } from "obsidian";

import { Notice } from "obsidian";
import { SongOfTheDaySettings } from "src/types/settings";

import pkg from "../../package.json";
import { SpotifyService } from "./spotify";

/**
 * Stored credentials for comparing against settings changes
 */
let storedCredentials:
  | null
  | undefined
  | { clientId: string; clientSecret: string } = undefined;

/**
 * Gets or creates a Spotify service instance for the plugin.
 * Handles credential validation and user notification if credentials are missing.
 * Recreates the service if credentials have changed.
 * @param settings - Plugin settings containing Spotify credentials
 * @param app - Obsidian app instance for opening settings
 * @param currentService - Current Spotify service instance (if any)
 * @returns Configured Spotify service, or null if credentials not set
 */
export function getOrCreateSpotifyService(
  settings: SongOfTheDaySettings,
  app: App,
  currentService: null | SpotifyService,
): null | SpotifyService {
  if (!settings.spotifyClientId || !settings.spotifyClientSecret) {
    new Notice("Please configure Spotify API credentials in settings");
    app.setting.open();
    app.setting.openTabById(pkg.name);
    return null;
  }

  if (
    currentService &&
    storedCredentials?.clientId === settings.spotifyClientId &&
    storedCredentials?.clientSecret === settings.spotifyClientSecret
  ) {
    return currentService;
  }

  storedCredentials = {
    clientId: settings.spotifyClientId,
    clientSecret: settings.spotifyClientSecret,
  };

  return new SpotifyService(
    settings.spotifyClientId,
    settings.spotifyClientSecret,
  );
}
