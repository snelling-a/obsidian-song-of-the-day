import { SpotifyTrack } from "../types";

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
    const uriMatch = input.match(/spotify:track:([a-zA-Z0-9]+)/);
    if (uriMatch) {
      return uriMatch[1];
    }

    // Handle Spotify URL: https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6
    const urlMatch = input.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
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
   * @throws Error if track not found or API request fails
   */
  async getTrack(trackId: string): Promise<SpotifyTrack> {
    const token = await this.getAccessToken();

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/tracks/${trackId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Track not found");
        }
        if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After");
          throw new Error(`Rate limited. Try again in ${retryAfter} seconds`);
        }
        throw new Error(`Failed to fetch track: ${response.status}`);
      }
      return await response.json();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to fetch track data: ${message}`);
    }
  }

  /**
   * Gets a valid Spotify API access token, requesting a new one if needed
   * @returns Valid access token
   * @throws Error if authentication fails
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const credentials = Buffer.from(
      `${this.clientId}:${this.clientSecret}`,
    ).toString("base64");

    try {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        body: "grant_type=client_credentials",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Authentication failed: ${response.status} - ${error}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + data.expires_in * 1000 - 60000; // Refresh 1 min early

      return data.access_token;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to authenticate with Spotify: ${message}`);
    }
  }
}
