import { Scopes, SpotifyApi } from "@spotify/web-api-ts-sdk";
import { requestUrl } from "obsidian";
import { mockSpotifyTrack } from "test/fixtures/spotify-track";
import { beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";

import { REDIRECT_URI, SPOTIFY_ACCOUNTS_BASE_URL } from "./constants";
import { SpotifyService } from "./index";

const mockClientId = "test-client-id";
const mockCodeVerifier = "test-code-verifier";
const mockAuthCode = "test-auth-code";

describe(SpotifyService, () => {
  const mockRequestUrl = vi.mocked(requestUrl);

  beforeEach(() => {
    vi.spyOn(SpotifyApi, "withAccessToken").mockReturnValue({
      playlists: {
        addItemsToPlaylist: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
      },
      tracks: {
        get: vi.fn<() => Promise<object>>().mockResolvedValue({}),
      },
    } as unknown as ReturnType<typeof SpotifyApi.withAccessToken>);

    vi.spyOn(SpotifyApi, "withClientCredentials").mockReturnValue({
      tracks: {
        get: vi.fn<() => Promise<object>>().mockResolvedValue({}),
      },
    } as unknown as ReturnType<typeof SpotifyApi.withClientCredentials>);
  });

  describe(SpotifyService.generateAuthUrl.name, () => {
    it("should return object with codeVerifier, state, and url properties", async () => {
      const result = await SpotifyService.generateAuthUrl(mockClientId);

      expect(result).toHaveProperty("codeVerifier");
      expect(result).toHaveProperty("state");
      expect(result).toHaveProperty("url");

      expectTypeOf(result.codeVerifier).toBeString();
      expectTypeOf(result.state).toBeString();
      expectTypeOf(result.url).toBeString();
    });

    it("should generate code verifier with 128 characters", async () => {
      const result = await SpotifyService.generateAuthUrl(mockClientId);

      expect(result.codeVerifier).toHaveLength(128);
    });

    it("should generate URL pointing to Spotify authorize endpoint", async () => {
      const result = await SpotifyService.generateAuthUrl(mockClientId);

      expect(result.url).toContain(`${SPOTIFY_ACCOUNTS_BASE_URL}/authorize`);
    });

    it("should include OAuth flow parameters in URL", async () => {
      const result = await SpotifyService.generateAuthUrl(mockClientId);
      const url = new URL(result.url);

      expect(url.searchParams.get("client_id")).toBe(mockClientId);
      expect(url.searchParams.get("response_type")).toBe("code");
      expect(url.searchParams.get("redirect_uri")).toBe(REDIRECT_URI);
      expect(url.searchParams.get("scope")).toBe(
        Scopes.playlistModify.join(" "),
      );
    });

    it("should include PKCE parameters in URL", async () => {
      const result = await SpotifyService.generateAuthUrl(mockClientId);
      const url = new URL(result.url);

      expect(url.searchParams.get("code_challenge_method")).toBe("S256");
      expect(url.searchParams.has("code_challenge")).toBe(true);
      expect(url.searchParams.has("state")).toBe(true);
    });

    it("should return state that matches URL parameter", async () => {
      const result = await SpotifyService.generateAuthUrl(mockClientId);
      const url = new URL(result.url);

      expect(url.searchParams.get("state")).toBe(result.state);
    });

    it("should generate different verifiers and states on multiple calls", async () => {
      const result1 = await SpotifyService.generateAuthUrl(mockClientId);
      const result2 = await SpotifyService.generateAuthUrl(mockClientId);

      expect(result1.codeVerifier).not.toBe(result2.codeVerifier);
      expect(result1.state).not.toBe(result2.state);

      const url1 = new URL(result1.url);
      const url2 = new URL(result2.url);

      expect(url1.searchParams.get("state")).not.toBe(
        url2.searchParams.get("state"),
      );
    });
  });

  describe(SpotifyService.exchangeCodeForTokens.name, () => {
    // Mock response from Spotify API (uses snake_case)
    const mockTokenResponse = {
      access_token: "mock_access_token_123",
      expires_in: 3600,
      refresh_token: "mock_refresh_token_456",
      token_type: "Bearer",
    };

    beforeEach(() => {
      mockRequestUrl.mockResolvedValue({
        arrayBuffer: new ArrayBuffer(0),
        headers: {},
        json: mockTokenResponse,
        status: 200,
        text: "",
      });
    });

    it("should successfully exchange code for tokens", async () => {
      const result = await SpotifyService.exchangeCodeForTokens(
        mockClientId,
        mockAuthCode,
        mockCodeVerifier,
      );

      expect(result).toStrictEqual({
        accessToken: mockTokenResponse.access_token,
        expiresIn: 3600,
        refreshToken: mockTokenResponse.refresh_token,
      });
    });

    it("should make POST request to correct token endpoint", async () => {
      await SpotifyService.exchangeCodeForTokens(
        mockClientId,
        mockAuthCode,
        mockCodeVerifier,
      );

      expect(mockRequestUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          url: `${SPOTIFY_ACCOUNTS_BASE_URL}/api/token`,
        }),
      );
    });

    it("should send OAuth flow parameters in request body", async () => {
      await SpotifyService.exchangeCodeForTokens(
        mockClientId,
        mockAuthCode,
        mockCodeVerifier,
      );

      const callArguments = mockRequestUrl.mock.calls[0][0];

      expect(callArguments).toHaveProperty("body");

      const parameters = new URLSearchParams(
        (callArguments as { body: string }).body,
      );

      expect(parameters.get("grant_type")).toBe("authorization_code");
      expect(parameters.get("client_id")).toBe(mockClientId);
      expect(parameters.get("redirect_uri")).toBe(REDIRECT_URI);
    });

    it("should send authorization code and PKCE verifier in request body", async () => {
      await SpotifyService.exchangeCodeForTokens(
        mockClientId,
        mockAuthCode,
        mockCodeVerifier,
      );

      const callArguments = mockRequestUrl.mock.calls[0][0];

      expect(callArguments).toHaveProperty("body");

      const parameters = new URLSearchParams(
        (callArguments as { body: string }).body,
      );

      expect(parameters.get("code")).toBe(mockAuthCode);
      expect(parameters.get("code_verifier")).toBe(mockCodeVerifier);
    });

    it("should set correct Content-Type header", async () => {
      await SpotifyService.exchangeCodeForTokens(
        mockClientId,
        mockAuthCode,
        mockCodeVerifier,
      );

      expect(mockRequestUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }),
      );
    });

    it("should transform snake_case response to camelCase", async () => {
      const result = await SpotifyService.exchangeCodeForTokens(
        mockClientId,
        mockAuthCode,
        mockCodeVerifier,
      );

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.expiresIn).toBeDefined();
    });

    it("should throw error when response contains error", async () => {
      mockRequestUrl.mockResolvedValueOnce({
        arrayBuffer: new ArrayBuffer(0),
        headers: {},
        json: {
          error: "invalid_grant",
          error_description: "Authorization code expired",
        },
        status: 400,
        text: "",
      });

      await expect(
        SpotifyService.exchangeCodeForTokens(
          mockClientId,
          mockAuthCode,
          mockCodeVerifier,
        ),
      ).rejects.toThrow(
        "Failed to exchange authorization code: Authorization code expired",
      );
    });

    it("should throw error when access_token is missing", async () => {
      mockRequestUrl.mockResolvedValueOnce({
        arrayBuffer: new ArrayBuffer(0),
        headers: {},
        json: {
          expires_in: 3600,
          refresh_token: "mock_refresh_token",
        },
        status: 200,
        text: "",
      });

      await expect(
        SpotifyService.exchangeCodeForTokens(
          mockClientId,
          mockAuthCode,
          mockCodeVerifier,
        ),
      ).rejects.toThrow("Failed to exchange authorization code");
    });
  });

  describe("extractTrackId", () => {
    let service: SpotifyService;

    beforeEach(() => {
      service = new SpotifyService(mockClientId, "test-client-secret");
    });

    it("should extract track ID from Spotify URI", () => {
      const result = service.extractTrackId(
        "spotify:track:6rqhFgbbKwnb9MLmUQDhG6",
      );

      expect(result).toBe("6rqhFgbbKwnb9MLmUQDhG6");
    });

    it("should extract track ID from Spotify URL", () => {
      const result = service.extractTrackId(
        "https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6",
      );

      expect(result).toBe("6rqhFgbbKwnb9MLmUQDhG6");
    });

    it("should extract track ID from URL with query parameters", () => {
      const result = service.extractTrackId(
        "https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6?si=abc123",
      );

      expect(result).toBe("6rqhFgbbKwnb9MLmUQDhG6");
    });

    it("should accept bare 22-character track ID", () => {
      const result = service.extractTrackId("6rqhFgbbKwnb9MLmUQDhG6");

      expect(result).toBe("6rqhFgbbKwnb9MLmUQDhG6");
    });

    it("should trim whitespace from input", () => {
      const result = service.extractTrackId("  6rqhFgbbKwnb9MLmUQDhG6  ");

      expect(result).toBe("6rqhFgbbKwnb9MLmUQDhG6");
    });

    it("should return null for invalid input", () => {
      expect(service.extractTrackId("invalid")).toBeNull();
      expect(service.extractTrackId("")).toBeNull();
      expect(service.extractTrackId("spotify:album:123")).toBeNull();
      expect(
        service.extractTrackId("https://open.spotify.com/album/123"),
      ).toBeNull();
    });

    it("should return null for ID that is too short", () => {
      const result = service.extractTrackId("abc123");

      expect(result).toBeNull();
    });

    it("should return null for ID that is too long", () => {
      const result = service.extractTrackId("6rqhFgbbKwnb9MLmUQDhG6extra");

      expect(result).toBeNull();
    });
  });

  describe("getTrack", () => {
    let service: SpotifyService;

    beforeEach(() => {
      vi.mocked(SpotifyApi.withClientCredentials).mockReturnValue({
        tracks: {
          get: vi.fn<() => Promise<typeof mockSpotifyTrack>>().mockResolvedValue(mockSpotifyTrack),
        },
      } as unknown as ReturnType<typeof SpotifyApi.withClientCredentials>);

      service = new SpotifyService(mockClientId, "test-client-secret");
    });

    it("should fetch track data from Spotify API", async () => {
      const track = await service.getTrack("5YAeJ0Cjg5yt2OYfGHYlOc");

      expect(track).toStrictEqual(mockSpotifyTrack);
    });

    it("should throw error when API request fails", async () => {
      vi.mocked(SpotifyApi.withClientCredentials).mockReturnValue({
        tracks: {
          get: vi.fn<() => Promise<never>>().mockRejectedValue(new Error("API error")),
        },
      } as unknown as ReturnType<typeof SpotifyApi.withClientCredentials>);

      const failingService = new SpotifyService(
        mockClientId,
        "test-client-secret",
      );

      await expect(failingService.getTrack("invalid-id")).rejects.toThrow(
        "Failed to fetch track data: API error",
      );
    });
  });

  describe("isUserAuthenticated", () => {
    let service: SpotifyService;

    beforeEach(() => {
      service = new SpotifyService(mockClientId, "test-client-secret");
    });

    it("should return false when user API is not initialized", () => {
      expect(service.isUserAuthenticated()).toBe(false);
    });

    it("should return true after initializing user API", () => {
      service.initializeUserApi(
        "access-token",
        "refresh-token",
        Date.now() + 3_600_000,
      );

      expect(service.isUserAuthenticated()).toBe(true);
    });
  });

  describe("initializeUserApi", () => {
    let service: SpotifyService;

    beforeEach(() => {
      service = new SpotifyService(mockClientId, "test-client-secret");
    });

    it("should initialize user API with provided tokens", () => {
      const mockWithAccessToken = vi.mocked(SpotifyApi.withAccessToken);

      service.initializeUserApi(
        "test-access-token",
        "test-refresh-token",
        Date.now() + 3_600_000,
      );

      expect(mockWithAccessToken).toHaveBeenCalledWith(
        mockClientId,
        expect.objectContaining({
          access_token: "test-access-token",
          refresh_token: "test-refresh-token",
          token_type: "Bearer",
        }),
        expect.any(Object),
      );
    });

    it("should calculate correct expires_in from expiry timestamp", () => {
      const mockWithAccessToken = vi.mocked(SpotifyApi.withAccessToken);
      const futureExpiry = Date.now() + 1_800_000;

      service.initializeUserApi("token", "refresh", futureExpiry);

      const call = mockWithAccessToken.mock.calls[0];
      const tokenObject = call[1] as { expires_in: number };

      expect(tokenObject.expires_in).toBeGreaterThan(0);
      expect(tokenObject.expires_in).toBeLessThanOrEqual(1800);
    });

    it("should handle expired tokens by setting expires_in to 0", () => {
      const mockWithAccessToken = vi.mocked(SpotifyApi.withAccessToken);
      const pastExpiry = Date.now() - 1000;

      service.initializeUserApi("token", "refresh", pastExpiry);

      const call = mockWithAccessToken.mock.calls[0];
      const tokenObject = call[1] as { expires_in: number };

      expect(tokenObject.expires_in).toBe(0);
    });
  });

  describe("addTrackToPlaylist", () => {
    let service: SpotifyService;
    const mockAddItems = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);

    beforeEach(() => {
      vi.mocked(SpotifyApi.withAccessToken).mockReturnValue({
        playlists: {
          addItemsToPlaylist: mockAddItems,
        },
      } as unknown as ReturnType<typeof SpotifyApi.withAccessToken>);

      service = new SpotifyService(mockClientId, "test-client-secret");
    });

    it("should throw error when user is not authenticated", async () => {
      await expect(
        service.addTrackToPlaylist("playlist-id", "spotify:track:abc123"),
      ).rejects.toThrow("User not authenticated");
    });

    it("should add track to playlist when authenticated", async () => {
      service.initializeUserApi(
        "access-token",
        "refresh-token",
        Date.now() + 3_600_000,
      );

      await service.addTrackToPlaylist("playlist-id", "spotify:track:abc123");

      expect(mockAddItems).toHaveBeenCalledWith("playlist-id", [
        "spotify:track:abc123",
      ]);
    });

    it("should throw error when API call fails", async () => {
      mockAddItems.mockRejectedValueOnce(new Error("Playlist not found"));

      service.initializeUserApi(
        "access-token",
        "refresh-token",
        Date.now() + 3_600_000,
      );

      await expect(
        service.addTrackToPlaylist("invalid-playlist", "spotify:track:abc123"),
      ).rejects.toThrow("Failed to add track to playlist: Playlist not found");
    });

    it("should handle non-Error API failure", async () => {
      mockAddItems.mockRejectedValueOnce("string error");

      service.initializeUserApi(
        "access-token",
        "refresh-token",
        Date.now() + 3_600_000,
      );

      await expect(
        service.addTrackToPlaylist("playlist-id", "spotify:track:abc123"),
      ).rejects.toThrow("Failed to add track to playlist: string error");
    });

    it("should throw error if userApi is null after token refresh", async () => {
      const expiredTimestamp = Date.now() - 1000;

      service.initializeUserApi(
        "expired-token",
        "refresh-token",
        expiredTimestamp,
      );

      vi.mocked(SpotifyApi.withAccessToken).mockReturnValueOnce(
        null as unknown as ReturnType<typeof SpotifyApi.withAccessToken>,
      );

      mockRequestUrl.mockResolvedValueOnce({
        arrayBuffer: new ArrayBuffer(0),
        headers: {},
        json: {
          access_token: "new-access-token",
          expires_in: 3600,
          refresh_token: "new-refresh-token",
          token_type: "Bearer",
        },
        status: 200,
        text: "",
      });

      await expect(
        service.addTrackToPlaylist("playlist-id", "spotify:track:abc123"),
      ).rejects.toThrow("Failed to initialize user API after token refresh");
    });
  });

  describe("token refresh", () => {
    let service: SpotifyService;
    const mockAddItems = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);

    beforeEach(() => {
      vi.mocked(SpotifyApi.withAccessToken).mockReturnValue({
        playlists: {
          addItemsToPlaylist: mockAddItems,
        },
      } as unknown as ReturnType<typeof SpotifyApi.withAccessToken>);

      mockRequestUrl.mockResolvedValue({
        arrayBuffer: new ArrayBuffer(0),
        headers: {},
        json: {
          access_token: "new-access-token",
          expires_in: 3600,
          refresh_token: "new-refresh-token",
          token_type: "Bearer",
        },
        status: 200,
        text: "",
      });

      service = new SpotifyService(mockClientId, "test-client-secret");
    });

    it("should refresh token when expired", async () => {
      const expiredTimestamp = Date.now() - 1000;

      service.initializeUserApi(
        "expired-token",
        "refresh-token",
        expiredTimestamp,
      );

      await service.addTrackToPlaylist("playlist-id", "spotify:track:abc123");

      expect(mockRequestUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          url: `${SPOTIFY_ACCOUNTS_BASE_URL}/api/token`,
        }),
      );
    });

    it("should call token refresh callback when provided", async () => {
      const onTokenRefresh = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
      const expiredTimestamp = Date.now() - 1000;

      service.initializeUserApi(
        "expired-token",
        "refresh-token",
        expiredTimestamp,
        onTokenRefresh,
      );

      await service.addTrackToPlaylist("playlist-id", "spotify:track:abc123");

      expect(onTokenRefresh).toHaveBeenCalledWith({
        accessToken: "new-access-token",
        expiresIn: 3600,
        refreshToken: "new-refresh-token",
      });
    });

    it("should throw error when refresh fails", async () => {
      mockRequestUrl.mockResolvedValueOnce({
        arrayBuffer: new ArrayBuffer(0),
        headers: {},
        json: {
          error: "invalid_grant",
          error_description: "Refresh token revoked",
        },
        status: 400,
        text: "",
      });

      const expiredTimestamp = Date.now() - 1000;

      service.initializeUserApi(
        "expired-token",
        "refresh-token",
        expiredTimestamp,
      );

      await expect(
        service.addTrackToPlaylist("playlist-id", "spotify:track:abc123"),
      ).rejects.toThrow(
        "Failed to refresh access token: Refresh token revoked",
      );
    });

    it("should refresh when token is about to expire within 5 minutes", async () => {
      const almostExpiredTimestamp = Date.now() + 4 * 60 * 1000;

      service.initializeUserApi(
        "almost-expired-token",
        "refresh-token",
        almostExpiredTimestamp,
      );

      await service.addTrackToPlaylist("playlist-id", "spotify:track:abc123");

      expect(mockRequestUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          url: `${SPOTIFY_ACCOUNTS_BASE_URL}/api/token`,
        }),
      );
    });

    it("should not refresh when token has more than 5 minutes remaining", async () => {
      const validTimestamp = Date.now() + 10 * 60 * 1000;

      service.initializeUserApi("valid-token", "refresh-token", validTimestamp);

      await service.addTrackToPlaylist("playlist-id", "spotify:track:abc123");

      expect(mockRequestUrl).not.toHaveBeenCalled();
    });

    it("should refresh when tokenExpiry is 0", async () => {
      service.initializeUserApi("token", "refresh-token", 0);

      await service.addTrackToPlaylist("playlist-id", "spotify:track:abc123");

      expect(mockRequestUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          url: `${SPOTIFY_ACCOUNTS_BASE_URL}/api/token`,
        }),
      );
    });

    it("should throw error when refresh token is empty", async () => {
      service.initializeUserApi("token", "", 0);

      await expect(
        service.addTrackToPlaylist("playlist-id", "spotify:track:abc123"),
      ).rejects.toThrow("No refresh token available");
    });

    it("should use existing refresh token when new one is not provided", async () => {
      mockRequestUrl.mockResolvedValueOnce({
        arrayBuffer: new ArrayBuffer(0),
        headers: {},
        json: {
          access_token: "new-access-token",
          expires_in: 3600,
          token_type: "Bearer",
        },
        status: 200,
        text: "",
      });

      const onTokenRefresh = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
      const expiredTimestamp = Date.now() - 1000;

      service.initializeUserApi(
        "expired-token",
        "original-refresh-token",
        expiredTimestamp,
        onTokenRefresh,
      );

      await service.addTrackToPlaylist("playlist-id", "spotify:track:abc123");

      expect(onTokenRefresh).toHaveBeenCalledWith({
        accessToken: "new-access-token",
        expiresIn: 3600,
        refreshToken: "original-refresh-token",
      });
    });

    it("should only refresh once when multiple concurrent requests occur", async () => {
      const expiredTimestamp = Date.now() - 1000;

      service.initializeUserApi(
        "expired-token",
        "refresh-token",
        expiredTimestamp,
      );

      await Promise.all([
        service.addTrackToPlaylist("playlist-1", "spotify:track:abc123"),
        service.addTrackToPlaylist("playlist-2", "spotify:track:def456"),
      ]);

      expect(mockRequestUrl).toHaveBeenCalledTimes(1);
    });
  });

  describe("getTrack error handling", () => {
    it("should handle non-Error rejection", async () => {
      vi.mocked(SpotifyApi.withClientCredentials).mockReturnValue({
        tracks: {
          get: vi.fn<() => Promise<never>>().mockRejectedValue("string error"),
        },
      } as unknown as ReturnType<typeof SpotifyApi.withClientCredentials>);

      const service = new SpotifyService(mockClientId, "test-client-secret");

      await expect(service.getTrack("track-id")).rejects.toThrow(
        "Failed to fetch track data: string error",
      );
    });
  });
});
