import { createMockApp } from "test/fixtures/app";
import { createMockPlugin } from "test/fixtures/plugin";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SpotifyService, TokenRefreshCallback } from "./index";
import {
  clearCachedService,
  getOrCreateSpotifyService,
} from "./spotify-manager";

vi.mock(import("./index"));

describe("spotify-manager", () => {
  const mockInitializeUserApi = vi.fn<SpotifyService["initializeUserApi"]>();
  let capturedTokenCallback: TokenRefreshCallback | undefined;

  function setupTokenCallbackCapture(): void {
    mockInitializeUserApi.mockImplementation(
      (
        _accessToken: string,
        _refreshToken: string,
        _expiry: number,
        callback?: TokenRefreshCallback,
      ) => {
        capturedTokenCallback = callback;
      },
    );
  }

  function invokeTokenCallback(tokens: {
    accessToken: string;
    expiresIn: number;
    refreshToken: string;
  }): Promise<void> {
    if (!capturedTokenCallback) {
      throw new Error("Token callback was not captured");
    }

    return capturedTokenCallback(tokens);
  }

  beforeEach(() => {
    clearCachedService();
    vi.clearAllMocks();
    capturedTokenCallback = undefined;

    vi.mocked(SpotifyService).mockImplementation(function (this: object) {
      (
        this as { initializeUserApi: typeof mockInitializeUserApi }
      ).initializeUserApi = mockInitializeUserApi;

      return this;
    } as unknown as typeof SpotifyService);
  });

  afterEach(() => {
    clearCachedService();
  });

  describe(clearCachedService, () => {
    it("should clear the cached service", () => {
      const plugin = createMockPlugin({
        spotifyClientId: "test-client-id",
        spotifyClientSecret: "test-client-secret",
      });

      const service1 = getOrCreateSpotifyService(plugin);

      expect(service1).not.toBeNull();

      clearCachedService();

      const service2 = getOrCreateSpotifyService(plugin);

      expect(service2).not.toBeNull();
      expect(SpotifyService).toHaveBeenCalledTimes(2);
    });
  });

  describe(getOrCreateSpotifyService, () => {
    it("should return null when client ID is missing", () => {
      const plugin = createMockPlugin({
        spotifyClientId: "",
        spotifyClientSecret: "test-secret",
      });
      plugin.app = createMockApp() as unknown as typeof plugin.app;

      const result = getOrCreateSpotifyService(plugin);

      expect(result).toBeNull();
    });

    it("should return null when client secret is missing", () => {
      const plugin = createMockPlugin({
        spotifyClientId: "test-id",
        spotifyClientSecret: "",
      });
      plugin.app = createMockApp() as unknown as typeof plugin.app;

      const result = getOrCreateSpotifyService(plugin);

      expect(result).toBeNull();
    });

    it("should open settings when credentials are missing", () => {
      const plugin = createMockPlugin({
        spotifyClientId: "",
        spotifyClientSecret: "",
      });
      const mockApp = createMockApp();
      plugin.app = mockApp as unknown as typeof plugin.app;

      getOrCreateSpotifyService(plugin);

      expect(mockApp.setting.open).toHaveBeenCalledWith();
      expect(mockApp.setting.openTabById).toHaveBeenCalledWith(
        "obsidian-song-of-the-day",
      );
    });

    it("should create a new SpotifyService when credentials are valid", () => {
      const plugin = createMockPlugin({
        spotifyClientId: "test-client-id",
        spotifyClientSecret: "test-client-secret",
      });

      const result = getOrCreateSpotifyService(plugin);

      expect(result).not.toBeNull();
      expect(SpotifyService).toHaveBeenCalledWith(
        "test-client-id",
        "test-client-secret",
      );
    });

    it("should return cached service on subsequent calls with same credentials", () => {
      const plugin = createMockPlugin({
        spotifyClientId: "test-client-id",
        spotifyClientSecret: "test-client-secret",
      });

      const service1 = getOrCreateSpotifyService(plugin);
      const service2 = getOrCreateSpotifyService(plugin);

      expect(service1).toBe(service2);
      expect(SpotifyService).toHaveBeenCalledTimes(1);
    });

    it("should create new service when credentials change", () => {
      const plugin = createMockPlugin({
        spotifyClientId: "test-client-id-1",
        spotifyClientSecret: "test-client-secret-1",
      });

      getOrCreateSpotifyService(plugin);

      plugin.settings.spotifyClientId = "test-client-id-2";
      plugin.settings.spotifyClientSecret = "test-client-secret-2";

      getOrCreateSpotifyService(plugin);

      expect(SpotifyService).toHaveBeenCalledTimes(2);
      expect(SpotifyService).toHaveBeenLastCalledWith(
        "test-client-id-2",
        "test-client-secret-2",
      );
    });

    it("should initialize user API when OAuth tokens are present", () => {
      const plugin = createMockPlugin({
        spotifyAccessToken: "test-access-token",
        spotifyClientId: "test-client-id",
        spotifyClientSecret: "test-client-secret",
        spotifyRefreshToken: "test-refresh-token",
        spotifyTokenExpiry: Date.now() + 3_600_000,
      });

      getOrCreateSpotifyService(plugin);

      expect(mockInitializeUserApi).toHaveBeenCalledWith(
        "test-access-token",
        "test-refresh-token",
        expect.any(Number),
        expect.any(Function),
      );
    });

    it("should not initialize user API when OAuth tokens are missing", () => {
      const plugin = createMockPlugin({
        spotifyClientId: "test-client-id",
        spotifyClientSecret: "test-client-secret",
      });

      getOrCreateSpotifyService(plugin);

      expect(mockInitializeUserApi).not.toHaveBeenCalled();
    });

    it("should update plugin settings when tokens are refreshed", async () => {
      setupTokenCallbackCapture();
      const plugin = createMockPlugin({
        spotifyAccessToken: "old-access-token",
        spotifyClientId: "test-client-id",
        spotifyClientSecret: "test-client-secret",
        spotifyRefreshToken: "old-refresh-token",
        spotifyTokenExpiry: Date.now() + 3_600_000,
      });
      vi.spyOn(plugin, "saveSettings").mockResolvedValue(undefined);

      getOrCreateSpotifyService(plugin);

      await invokeTokenCallback({
        accessToken: "new-access-token",
        expiresIn: 7200,
        refreshToken: "new-refresh-token",
      });

      expect(plugin.settings.spotifyAccessToken).toBe("new-access-token");
      expect(plugin.settings.spotifyRefreshToken).toBe("new-refresh-token");
      expect(plugin.settings.spotifyTokenExpiry).toBeGreaterThan(Date.now());
      expect(plugin.saveSettings).toHaveBeenCalledWith();
    });

    it("should show notice when saving tokens fails", async () => {
      setupTokenCallbackCapture();
      const plugin = createMockPlugin({
        spotifyAccessToken: "old-access-token",
        spotifyClientId: "test-client-id",
        spotifyClientSecret: "test-client-secret",
        spotifyRefreshToken: "old-refresh-token",
        spotifyTokenExpiry: Date.now() + 3_600_000,
      });
      vi.spyOn(plugin, "saveSettings").mockRejectedValue(
        new Error("Save failed"),
      );

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      getOrCreateSpotifyService(plugin);

      await invokeTokenCallback({
        accessToken: "new-access-token",
        expiresIn: 7200,
        refreshToken: "new-refresh-token",
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to save refreshed tokens:",
        "Save failed",
      );

      consoleSpy.mockRestore();
    });

    it("should handle non-Error rejection when saving tokens fails", async () => {
      setupTokenCallbackCapture();
      const plugin = createMockPlugin({
        spotifyAccessToken: "old-access-token",
        spotifyClientId: "test-client-id",
        spotifyClientSecret: "test-client-secret",
        spotifyRefreshToken: "old-refresh-token",
        spotifyTokenExpiry: Date.now() + 3_600_000,
      });
      vi.spyOn(plugin, "saveSettings").mockRejectedValue("string error");

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      getOrCreateSpotifyService(plugin);

      await invokeTokenCallback({
        accessToken: "new-access-token",
        expiresIn: 7200,
        refreshToken: "new-refresh-token",
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to save refreshed tokens:",
        "string error",
      );

      consoleSpy.mockRestore();
    });
  });
});
