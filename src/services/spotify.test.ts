import {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
} from "test/fixtures/settings";
import {
  mockAuthResponse,
  mockTrackId,
  mockTrackResponse,
} from "test/fixtures/spotify";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SPOTIFY_BASE_URL, SpotifyService } from "./spotify";

const mockAuthFetch = () =>
  vi.spyOn(global, "fetch").mockResolvedValueOnce({
    json: () => Promise.resolve(mockAuthResponse),
    ok: true,
  } as Response);

describe(SpotifyService, () => {
  let service: SpotifyService;

  beforeEach(() => {
    service = new SpotifyService(SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET);
  });

  describe(SpotifyService.prototype.extractTrackId, () => {
    it.each([
      `  spotify:track:${mockTrackId}  `,
      `https://open.spotify.com/track/${mockTrackId}?si=abc123`,
      `https://open.spotify.com/track/${mockTrackId}`,
      `spotify:track:${mockTrackId}`,
      mockTrackId,
    ])('should extract track ID from "%s"', (input) => {
      const result = service.extractTrackId(input);

      expect(result).toBe(mockTrackId);
    });

    it.each([
      "",
      "abc123",
      "not-a-valid-spotify-id",
      `https://open.spotify.com/album/${mockTrackId}`,
    ])('should return null if track ID is "%s"', (input) => {
      const result = service.extractTrackId(input);

      expect(result).toBeNull();
    });
  });

  describe(SpotifyService.prototype.getTrack, () => {
    it("should fetch track data successfully", async () => {
      expect.hasAssertions();
      mockAuthFetch().mockResolvedValueOnce({
        json: () => Promise.resolve(mockTrackResponse),
        ok: true,
      } as Response);

      const track = await service.getTrack("789");

      expect(track).toStrictEqual(mockTrackResponse);
      expect(fetch).toHaveBeenNthCalledWith(
        1,
        "https://accounts.spotify.com/api/token",
        expect.objectContaining({
          body: "grant_type=client_credentials",
          headers: expect.objectContaining({
            Authorization: expect.stringContaining("Basic") as string,
            "Content-Type": "application/x-www-form-urlencoded",
          }) as Record<string, string>,
          method: "POST",
        }),
      );
      expect(fetch).toHaveBeenNthCalledWith(
        2,
        `${SPOTIFY_BASE_URL}/tracks/789`,
        expect.objectContaining({
          headers: { Authorization: "Bearer mock-token" },
        }),
      );
    });

    it("should reuse cached token for multiple requests", async () => {
      expect.hasAssertions();
      mockAuthFetch()
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockTrackResponse),
          ok: true,
        } as Response)
        .mockResolvedValueOnce({
          json: () => Promise.resolve(mockTrackResponse),
          ok: true,
        } as Response);

      await service.getTrack(mockTrackId);
      await service.getTrack(mockTrackId);

      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it.each([
      {
        error: "Failed to authenticate with Spotify",
        mock: {
          ok: false,
          status: 401,
          text: () => Promise.resolve("Invalid credentials"),
        } as Response,
      },
    ])('should throw "$error" error', async ({ error, mock }) => {
      expect.hasAssertions();
      vi.spyOn(global, "fetch").mockResolvedValue(mock);
      await expect(service.getTrack(mockTrackId)).rejects.toThrow(error);
    });

    it.each([
      {
        error: "Failed to authenticate with Spotify: Network error",
        mock: new Error("Network error"),
      },
      {
        error: "Failed to authenticate with Spotify: Non-error exception",
        mock: "Non-error exception",
      },
    ])('should throw "$error" error', async ({ error, mock }) => {
      expect.hasAssertions();
      vi.spyOn(global, "fetch").mockRejectedValue(mock);
      await expect(service.getTrack(mockTrackId)).rejects.toThrow(error);
    });

    it.each([
      { error: "Track not found", mock: { ok: false, status: 404 } as Response },
      {
        error: "Rate limited. Try again in 60 seconds",
        mock: {
          headers: new Headers({ "Retry-After": "60" }),
          ok: false,
          status: 429,
        } as Response,
      },
      {
        error: "Rate limited. Try again in unknown seconds",
        mock: {
          headers: new Headers(),
          ok: false,
          status: 429,
        } as Response,
      },
      {
        error: "Failed to fetch track: 500",
        mock: { ok: false, status: 500 } as Response,
      },
    ])('should throw "$error" error', async ({ error, mock }) => {
      expect.hasAssertions();
      mockAuthFetch().mockResolvedValueOnce(mock);
      await expect(service.getTrack(mockTrackId)).rejects.toThrow(error);
    });

    it.each([
      {
        error: "Failed to fetch track data: Network timeout",
        mock: new Error("Network timeout"),
      },
      { error: "Failed to fetch track data: String error", mock: "String error" },
    ])('should throw "$error" error', async ({ error, mock }) => {
      expect.hasAssertions();
      mockAuthFetch().mockRejectedValueOnce(mock);
      await expect(service.getTrack(mockTrackId)).rejects.toThrow(error);
    });
  });
});
