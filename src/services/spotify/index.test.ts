import { beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";

// Mock obsidian before importing anything that uses it
vi.mock(import("obsidian"));

import { requestUrl } from "obsidian";

import {
  REDIRECT_URI,
  SPOTIFY_ACCOUNTS_BASE_URL,
  SPOTIFY_SCOPES,
} from "./constants";
import { SpotifyService } from "./index";

const mockClientId = "test-client-id";
const mockCodeVerifier = "test-code-verifier";
const mockAuthCode = "test-auth-code";

describe(SpotifyService, () => {
  const mockRequestUrl = vi.mocked(requestUrl);

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
      expect(url.searchParams.get("scope")).toBe(SPOTIFY_SCOPES.join(" "));
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

      const callArgs = mockRequestUrl.mock.calls[0][0];

      expect(callArgs).toHaveProperty("body");

      const params = new URLSearchParams((callArgs as { body: string }).body);

      expect(params.get("grant_type")).toBe("authorization_code");
      expect(params.get("client_id")).toBe(mockClientId);
      expect(params.get("redirect_uri")).toBe(REDIRECT_URI);
    });

    it("should send authorization code and PKCE verifier in request body", async () => {
      await SpotifyService.exchangeCodeForTokens(
        mockClientId,
        mockAuthCode,
        mockCodeVerifier,
      );

      const callArgs = mockRequestUrl.mock.calls[0][0];

      expect(callArgs).toHaveProperty("body");

      const params = new URLSearchParams((callArgs as { body: string }).body);

      expect(params.get("code")).toBe(mockAuthCode);
      expect(params.get("code_verifier")).toBe(mockCodeVerifier);
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
  });
});
