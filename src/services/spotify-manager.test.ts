import type { App } from "obsidian";

import { Notice } from "obsidian";
import { DEFAULT_SETTINGS } from "src/constants/settings";
import { SongOfTheDaySettings } from "src/types/settings";
import { createMockApp } from "test/fixtures/obsidian";
import { mockValidSettings } from "test/fixtures/settings";
import { beforeEach, describe, expect, it } from "vitest";

import { SpotifyService } from "./spotify";
import { getOrCreateSpotifyService } from "./spotify-manager";

describe(getOrCreateSpotifyService, () => {
  let mockApp: App;
  let mockService: SpotifyService;

  beforeEach(() => {
    mockApp = createMockApp();
    mockService = new SpotifyService("test-client-id", "test-client-secret");
  });

  it("should create new service with valid credentials", () => {
    const service = getOrCreateSpotifyService(mockValidSettings, mockApp, null);

    expect(service).toBeInstanceOf(SpotifyService);
  });

  it.each<SongOfTheDaySettings>([
    DEFAULT_SETTINGS,
    { ...DEFAULT_SETTINGS, spotifyClientId: "spotify-client-id" },
    { ...DEFAULT_SETTINGS, spotifyClientSecret: "spotify-client-secret" },
  ])(
    "should return null and show notice when spotifyClientId is $spotifyClientId and spotifyClientSecret is $spotifyClientSecret",
    (settings) => {
      expect.hasAssertions();
      const service = getOrCreateSpotifyService(settings, mockApp, null);

      expect(service).toBeNull();
      expect(Notice).toHaveBeenCalledWith(
        "Please configure Spotify API credentials in settings",
      );
      expect(mockApp.setting.open).toHaveBeenCalledWith();
      expect(mockApp.setting.openTabById).toHaveBeenCalledWith(
        "obsidian-song-of-the-day",
      );
    },
  );

  it("should reuse existing service when credentials unchanged", () => {
    const service1 = getOrCreateSpotifyService(
      mockValidSettings,
      mockApp,
      mockService,
    );
    const service2 = getOrCreateSpotifyService(
      mockValidSettings,
      mockApp,
      service1,
    );

    expect(service1).toBe(mockService);
    expect(service2).toBe(service1);
  });

  it("should create new service when credentials change", () => {
    const service1 = getOrCreateSpotifyService(
      mockValidSettings,
      mockApp,
      mockService,
    );

    const newSettings = {
      ...mockValidSettings,
      spotifyClientId: "new-client-id",
      spotifyClientSecret: "new-client-secret",
    };

    const service2 = getOrCreateSpotifyService(newSettings, mockApp, service1);

    expect(service2).not.toBe(service1);
    expect(service2).toBeInstanceOf(SpotifyService);
  });

  it.each([
    {
      name: "client ID changes",
      newSettings: {
        ...mockValidSettings,
        spotifyClientId: "different-client-id",
      },
    },
    {
      name: "client secret changes",
      newSettings: {
        ...mockValidSettings,
        spotifyClientSecret: "different-client-secret",
      },
    },
  ])("should create new service when $name", ({ newSettings }) => {
    const service1 = getOrCreateSpotifyService(
      mockValidSettings,
      mockApp,
      null,
    );

    const service2 = getOrCreateSpotifyService(newSettings, mockApp, service1);

    expect(service2).not.toBe(service1);
  });
});
