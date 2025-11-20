import { requestUrl } from "obsidian";
import { AccessToken, Track } from "src/types/spotify";

export const SPOTIFY_BASE_URL = "https://api.spotify.com/v1";

/**
 * Service for interacting with the Spotify Web API
 */
export class SpotifyService {
  private accessToken: null | string = null;
  private clientId: string;
  private clientSecret: string;
  private tokenExpiry = 0;

  /**
   * Creates a Spotify API service with client credentials.
   * @param clientId - Spotify application client ID
   * @param clientSecret - Spotify application client secret
   */
  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  /**
   * Extracts Spotify track ID from various input formats
   * @param input - Spotify URL, URI, or raw track ID
   * @returns Track ID if valid, null otherwise
   */
  extractTrackId(input: string): null | string {
    input = input.trim();

    // Handle Spotify URI: spotify:track:6rqhFgbbKwnb9MLmUQDhG6
    const uriMatch = /spotify:track:([a-zA-Z0-9]+)/.exec(input);

    if (uriMatch) {
      return uriMatch[1];
    }

    // Handle Spotify URL: https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6
    const urlMatch = /spotify\.com\/track\/([a-zA-Z0-9]+)/.exec(input);

    if (urlMatch) {
      return urlMatch[1];
    }

    // Handle bare track ID (22 characters)
    if (/^[a-zA-Z0-9]{22}$/.test(input)) {
      return input;
    }

    return null;
  }

  /**
   * Fetches track data from Spotify API
   * @param trackId - Spotify track ID
   * @returns Track data including metadata, album info, and artist details
   * @throws {Error} If track not found or API request fails
   */
  async getTrack(trackId: string): Promise<Track> {
    const token = await this.getAccessToken();

    try {
      const response = await requestUrl({
        headers: { Authorization: `Bearer ${token}` },
        url: `${SPOTIFY_BASE_URL}/tracks/${trackId}`,
      });

      return response.json as Track;
    } catch (error: unknown) {
      if (error && typeof error === "object" && "status" in error) {
        const status = (error as { status: number }).status;

        if (status === 404) {
          throw new Error("Track not found");
        }

        if (status === 429) {
          const headers =
            "headers" in error
              ? (error as { headers: Record<string, string> }).headers
              : {};
          const retryAfter = headers["retry-after"] || "unknown";

          throw new Error(`Rate limited. Try again in ${retryAfter} seconds`);
        }
        throw new Error(`Failed to fetch track: ${String(status)}`);
      }

      const message = error instanceof Error ? error.message : String(error);

      throw new Error(`Failed to fetch track data: ${message}`);
    }
  }

  /**
   * Gets a valid Spotify API access token, requesting a new one if needed
   * @returns Valid access token
   * @throws {Error} If authentication fails
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const credentials = Buffer.from(
      `${this.clientId}:${this.clientSecret}`,
    ).toString("base64");

    try {
      const response = await requestUrl({
        body: "grant_type=client_credentials",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        method: "POST",
        url: "https://accounts.spotify.com/api/token",
      });

      const data = response.json as AccessToken;

      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + data.expires_in * 1000 - 60000; // Refresh 1 min early

      return data.access_token;
    } catch (error: unknown) {
      if (error && typeof error === "object" && "status" in error) {
        const status = (error as { status: number }).status;
        const text =
          "text" in error ? (error as { text: string }).text : "Unknown error";

        throw new Error(`Authentication failed: ${String(status)} - ${text}`);
      }

      const message = error instanceof Error ? error.message : String(error);

      throw new Error(`Failed to authenticate with Spotify: ${message}`);
    }
  }
}
