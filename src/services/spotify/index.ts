import { AccessToken, SpotifyApi, Track } from "@spotify/web-api-ts-sdk";
import { requestUrl } from "obsidian";

import {
  REDIRECT_URI,
  SPOTIFY_ACCOUNTS_BASE_URL,
  SPOTIFY_SCOPES,
} from "./constants";

/**
 * OAuth token data
 */
interface OAuthTokens {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
}

/**
 * Callback for when tokens are refreshed
 */
type TokenRefreshCallback = (tokens: OAuthTokens) => Promise<void>;

/** Spotify API service for fetching track data */
export class SpotifyService {
  private api: SpotifyApi;
  private clientId: string;
  private clientSecret: string;
  private onTokenRefresh: null | TokenRefreshCallback = null;
  private refreshPromise: null | Promise<void> = null;
  private refreshToken: null | string = null;
  private tokenExpiry: null | number = null;
  private userApi: null | SpotifyApi = null;

  /**
   * Creates a Spotify API service with client credentials.
   * @param clientId Spotify application client ID
   * @param clientSecret Spotify application client secret
   */
  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.api = SpotifyApi.withClientCredentials(clientId, clientSecret, [], {
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
    });
  }

  /**
   * Exchanges authorization code for access and refresh tokens.
   * @param clientId Spotify application client ID
   * @param code The authorization code from callback
   * @param codeVerifier The PKCE code verifier
   * @returns OAuth tokens
   */
  public static async exchangeCodeForTokens(
    clientId: string,
    code: string,
    codeVerifier: string,
  ): Promise<OAuthTokens> {
    const params = new URLSearchParams({
      client_id: clientId,
      code,
      code_verifier: codeVerifier,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
    });

    const response = await requestUrl({
      body: params.toString(),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
      url: `${SPOTIFY_ACCOUNTS_BASE_URL}/api/token`,
    });

    const data = response.json as AccessToken;

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
      refreshToken: data.refresh_token,
    };
  }

  /**
   * Generates the authorization URL for user to authenticate.
   * @param clientId Spotify application client ID
   * @returns The authorization URL with PKCE challenge and state for CSRF protection
   */
  public static async generateAuthUrl(
    clientId: string,
  ): Promise<{ codeVerifier: string; state: string; url: string }> {
    const codeVerifier = SpotifyService.generateCodeVerifier();
    const codeChallenge
      = await SpotifyService.generateCodeChallenge(codeVerifier);
    const state = SpotifyService.generateRandomString(16);

    const params = new URLSearchParams({
      client_id: clientId,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      redirect_uri: REDIRECT_URI,
      response_type: "code",
      scope: SPOTIFY_SCOPES.join(" "),
      state,
    });

    return {
      codeVerifier,
      state,
      url: `${SPOTIFY_ACCOUNTS_BASE_URL}/authorize?${params.toString()}`,
    };
  }

  /**
   * Generates a code challenge from a code verifier for PKCE.
   * @param codeVerifier The code verifier for PKCE.
   * @returns Base64 URL-encoded SHA-256 hash of the code verifier
   */
  private static async generateCodeChallenge(
    codeVerifier: string,
  ): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hash = await crypto.subtle.digest("SHA-256", data);
    const bytes = new Uint8Array(hash);

    return btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  /**
   * Generates a code verifier for PKCE.
   * @returns Random code verifier string
   */
  private static generateCodeVerifier(): string {
    return SpotifyService.generateRandomString(128);
  }

  /**
   * Generates a random string for OAuth state parameter.
   * @param length Length of the string to generate
   * @returns A random alphanumeric string
   */
  private static generateRandomString(length: number): string {
    const possible
      = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const values = crypto.getRandomValues(new Uint8Array(length));

    return Array.from(values)
      .map(x => possible[x % possible.length])
      .join("");
  }

  /**
   * Adds a track to a Spotify playlist.
   * @param playlistId The ID of the Spotify Song of the Day playlist
   * @param trackUri The Spotify track URI (e.g., "spotify:track:6rqhFgbbKwnb9MLmUQDhG6")
   * @throws Error if not authenticated or request fails
   */
  public async addTrackToPlaylist(
    playlistId: string,
    trackUri: string,
  ): Promise<void> {
    await this.ensureValidToken();

    if (!this.userApi) {
      throw new Error("Failed to initialize user API after token refresh");
    }

    try {
      await this.userApi.playlists.addItemsToPlaylist(playlistId, [trackUri]);
    }
    catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to add track to playlist: ${message}`);
    }
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
      return await this.api.tracks.get(trackId);
    }
    catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to fetch track data: ${message}`);
    }
  }

  /**
   * Initializes user API with existing tokens.
   * @param accessToken The OAuth access token
   * @param refreshToken The OAuth refresh token
   * @param tokenExpiry The token expiry timestamp in milliseconds
   * @param onTokenRefresh Optional callback for when tokens are refreshed
   */
  public initializeUserApi(
    accessToken: string,
    refreshToken: string,
    tokenExpiry: number,
    onTokenRefresh?: TokenRefreshCallback,
  ): void {
    this.refreshToken = refreshToken;
    this.tokenExpiry = tokenExpiry;
    this.onTokenRefresh = onTokenRefresh ?? null;

    this.userApi = SpotifyApi.withAccessToken(this.clientId, {
      access_token: accessToken,
      expires_in: Math.floor((tokenExpiry - Date.now()) / 1000),
      refresh_token: refreshToken,
      token_type: "Bearer",
    });
  }

  /**
   * Checks if user is authenticated (has valid user API).
   * @returns True if user is authenticated
   */
  public isUserAuthenticated(): boolean {
    return this.userApi !== null;
  }

  /**
   * Ensures the access token is valid, refreshing if necessary.
   * Uses a promise queue to prevent concurrent refresh attempts.
   * @throws Error if not authenticated or refresh fails
   */
  private async ensureValidToken(): Promise<void> {
    if (!this.userApi) {
      throw new Error(
        "User not authenticated. Please authenticate in settings first.",
      );
    }

    if (this.isTokenExpired()) {
      if (this.refreshPromise) {
        await this.refreshPromise;
      }
      else {
        this.refreshPromise = this.refreshAccessToken();
        try {
          await this.refreshPromise;
        }
        finally {
          this.refreshPromise = null;
        }
      }
    }
  }

  /**
   * Checks if the current access token is expired or will expire soon.
   * @returns True if token is expired or will expire within 5 minutes
   */
  private isTokenExpired(): boolean {
    if (!this.tokenExpiry) {
      return true;
    }

    const bufferTime = 5 * 60 * 1000;

    return Date.now() >= this.tokenExpiry - bufferTime;
  }

  /**
   * Refreshes the access token using the refresh token.
   * @throws Error if refresh token is not available or refresh fails
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error("No refresh token available");
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      grant_type: "refresh_token",
      refresh_token: this.refreshToken,
    });

    const authHeader = btoa(`${this.clientId}:${this.clientSecret}`);

    const response = await requestUrl({
      body: params.toString(),
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
      url: `${SPOTIFY_ACCOUNTS_BASE_URL}/api/token`,
    });

    const data = response.json as AccessToken;
    const expiresIn = data.expires_in;
    const newTokenExpiry = Date.now() + expiresIn * 1000;

    this.tokenExpiry = newTokenExpiry;
    // Spotify may not return a new refresh token, use existing one if not provided
    if (data.refresh_token) {
      this.refreshToken = data.refresh_token;
    }

    this.userApi = SpotifyApi.withAccessToken(this.clientId, {
      access_token: data.access_token,
      expires_in: expiresIn,
      refresh_token: this.refreshToken,
      token_type: "Bearer",
    });

    if (this.onTokenRefresh) {
      await this.onTokenRefresh({
        accessToken: data.access_token,
        expiresIn,
        refreshToken: this.refreshToken,
      });
    }
  }
}
