import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { requestUrl } from "obsidian";

import { Track } from "./types";

/** Spotify API service for fetching track data */
export class SpotifyService {
  private api: SpotifyApi;

  /**
   * Creates a Spotify API service with client credentials.
   * @param clientId Spotify application client ID
   * @param clientSecret Spotify application client secret
   */
  constructor(clientId: string, clientSecret: string) {
    this.api = SpotifyApi.withClientCredentials(
      clientId,
      clientSecret,
      [],
      {
        fetch: async (
          input: RequestInfo | URL,
          init?: RequestInit,
        ): Promise<Response> => {
          let url: string;
          if (typeof input === "string") {
            url = input;
          }
          else if (input instanceof URL) {
            url = input.href;
          }
          else {
            url = input.url;
          }

          const response = await requestUrl({
            body: init?.body as string | undefined,
            headers: init?.headers as Record<string, string>,
            method: init?.method ?? "GET",
            url,
          });

          return new Response(JSON.stringify(response.json), {
            headers: response.headers,
            status: response.status,
          });
        },
      },
    );
  }

  /**
   * Extracts Spotify track ID from various input formats.
   * @param input Spotify URL, URI, or raw track ID
   * @returns Track ID if valid, null otherwise
   */
  public extractTrackId(input: string): null | string {
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
   * Fetches track data from Spotify API.
   * @param trackId The unique identifier for the Spotify track
   * @returns Track data including metadata, album info, and artist details
   * @throws Error if track not found or API request fails
   */
  public async getTrack(trackId: string): Promise<Track> {
    try {
      return await this.api.tracks.get(trackId) as Track;
    }
    catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to fetch track data: ${message}`);
    }
  }
}
