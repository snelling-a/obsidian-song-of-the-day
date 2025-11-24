import type SongOfTheDayPlugin from "main";

import { Notice } from "obsidian";

import pkg from "../../../package.json";
import { SpotifyService } from "../spotify";

/**
 * Cached Spotify service instance and credentials
 */
let cachedService: null | SpotifyService = null;
let storedCredentials:
  | null
  | undefined
  | { clientId: string; clientSecret: string } = undefined;

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
  if (
    !plugin.settings.spotifyClientId
    || !plugin.settings.spotifyClientSecret
  ) {
    new Notice("Please configure Spotify API credentials in settings");
    plugin.app.setting.open();
    plugin.app.setting.openTabById(pkg.name);

    return null;
  }

  if (
    cachedService
    && storedCredentials?.clientId === plugin.settings.spotifyClientId
    && storedCredentials.clientSecret === plugin.settings.spotifyClientSecret
  ) {
    return cachedService;
  }

  storedCredentials = {
    clientId: plugin.settings.spotifyClientId,
    clientSecret: plugin.settings.spotifyClientSecret,
  };

  const service = new SpotifyService(
    plugin.settings.spotifyClientId,
    plugin.settings.spotifyClientSecret,
  );

  if (
    plugin.settings.spotifyAccessToken
    && plugin.settings.spotifyRefreshToken
    && plugin.settings.spotifyTokenExpiry
  ) {
    service.initializeUserApi(
      plugin.settings.spotifyAccessToken,
      plugin.settings.spotifyRefreshToken,
      plugin.settings.spotifyTokenExpiry,
      async (tokens) => {
        plugin.settings.spotifyAccessToken = tokens.accessToken;
        plugin.settings.spotifyRefreshToken = tokens.refreshToken;
        plugin.settings.spotifyTokenExpiry
          = Date.now() + tokens.expiresIn * 1000;
        await plugin.saveSettings();
      },
    );
  }

  cachedService = service;

  return service;
}
