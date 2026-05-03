import type SongOfTheDayPlugin from "main";

import { Notice } from "obsidian";
import { getClientId, getClientSecret } from "src/utils/secret-storage";

import pkg from "../../../package.json";
import { SpotifyService } from "../spotify";

/**
 * Cached Spotify service instance and credentials
 */
let cachedService: null | SpotifyService = null;
let storedCredentials:
  | null
  | undefined
  | { clientId: string; clientSecret: string };

/**
 * Clears the cached Spotify service instance.
 * Call this after OAuth tokens are updated to ensure the next service instance
 * is recreated with the new tokens.
 */
export function clearCachedService(): void {
  cachedService = null;
}

/**
 * Gets or creates a Spotify service instance for the plugin.
 * Handles credential validation and user notification if credentials are missing.
 * Recreates the service if credentials have changed.
 * @param plugin The plugin instance
 * @returns Configured Spotify service, or null if credentials not set
 */
export function getOrCreateSpotifyService(
  plugin: SongOfTheDayPlugin,
): null | SpotifyService {
  const clientId = getClientId(plugin);
  const clientSecret = getClientSecret(plugin);

  if (!clientId || !clientSecret) {
    new Notice("Configure Spotify API credentials in settings");
    plugin.app.setting.open();
    plugin.app.setting.openTabById(pkg.name);

    return null;
  }

  if (
    cachedService &&
    storedCredentials?.clientId === clientId &&
    storedCredentials.clientSecret === clientSecret
  ) {
    return cachedService;
  }

  storedCredentials = {
    clientId,
    clientSecret,
  };

  const service = new SpotifyService(clientId, clientSecret);

  if (
    plugin.settings.spotifyAccessToken &&
    plugin.settings.spotifyRefreshToken &&
    plugin.settings.spotifyTokenExpiry
  ) {
    service.initializeUserApi(
      plugin.settings.spotifyAccessToken,
      plugin.settings.spotifyRefreshToken,
      plugin.settings.spotifyTokenExpiry,
      async (tokens) => {
        plugin.settings.spotifyAccessToken = tokens.accessToken;
        plugin.settings.spotifyRefreshToken = tokens.refreshToken;
        plugin.settings.spotifyTokenExpiry =
          Date.now() + tokens.expiresIn * 1000;
        try {
          await plugin.saveSettings();
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : String(error);
          console.error("Failed to save refreshed tokens:", message);
          new Notice("Failed to save Spotify tokens");
        }
      },
    );
  }

  cachedService = service;

  return service;
}
