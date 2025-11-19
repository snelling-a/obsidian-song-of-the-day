/**
 * Mock settings for testing.
 */

import { DEFAULT_SETTINGS } from "src/constants/settings";
import { SongOfTheDaySettings } from "src/types/settings";

export const SPOTIFY_CLIENT_ID = "your-spotify-client-id";

export const SPOTIFY_CLIENT_SECRET = "your-spotify-client-secret";

/**
 * Valid settings with test Spotify credentials for testing authenticated flows.
 */
export const mockValidSettings: SongOfTheDaySettings = {
  ...DEFAULT_SETTINGS,
  outputFolder: "Music",
  spotifyClientId: SPOTIFY_CLIENT_ID,
  spotifyClientSecret: SPOTIFY_CLIENT_SECRET,
};
