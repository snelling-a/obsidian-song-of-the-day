export const SPOTIFY_SCOPES = [
  "playlist-modify-public",
  "playlist-modify-private",
];

/** OAuth redirect URI for Spotify authentication */
export const REDIRECT_URI = "https://example.com/callback";
/** Spotify Accounts service base URL */
export const SPOTIFY_ACCOUNTS_BASE_URL = "https://accounts.spotify.com";
/** Spotify token endpoint URL */
export const SPOTIFY_TOKEN_URL = `${SPOTIFY_ACCOUNTS_BASE_URL}/api/token`;
