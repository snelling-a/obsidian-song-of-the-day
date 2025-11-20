import { requestUrl } from "obsidian";
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

const mockAuthRequest = () =>
  vi.mocked(requestUrl).mockResolvedValueOnce({
    arrayBuffer: new ArrayBuffer(0),
    headers: {},
    json: mockAuthResponse,
    status: 200,
    text: "",
  });

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
      mockAuthRequest().mockResolvedValueOnce({
        arrayBuffer: new ArrayBuffer(0),
        headers: {},
        json: mockTrackResponse,
        status: 200,
        text: "",
      });

      const track = await service.getTrack("789");

      expect(track).toStrictEqual(mockTrackResponse);
      expect(requestUrl).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          body: "grant_type=client_credentials",
          headers: expect.objectContaining({
            Authorization: expect.stringContaining("Basic") as string,
            "Content-Type": "application/x-www-form-urlencoded",
          }) as Record<string, string>,
          method: "POST",
          url: "https://accounts.spotify.com/api/token",
        }),
      );
      expect(requestUrl).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          headers: { Authorization: "Bearer mock-token" },
          url: `${SPOTIFY_BASE_URL}/tracks/789`,
        }),
      );
    });

    it("should reuse cached token for multiple requests", async () => {
      expect.hasAssertions();
      mockAuthRequest()
        .mockResolvedValueOnce({
          arrayBuffer: new ArrayBuffer(0),
          headers: {},
          json: mockTrackResponse,
          status: 200,
          text: "",
        })
        .mockResolvedValueOnce({
          arrayBuffer: new ArrayBuffer(0),
          headers: {},
          json: mockTrackResponse,
          status: 200,
          text: "",
        });

      await service.getTrack(mockTrackId);
      await service.getTrack(mockTrackId);

      expect(requestUrl).toHaveBeenCalledTimes(3);
    });

    it.each([
      {
        error: "Authentication failed: 401 - Invalid credentials",
        mock: {
          status: 401,
          text: "Invalid credentials",
        },
      },
    ])('should throw "$error" error', async ({ error, mock }) => {
      expect.hasAssertions();
      vi.mocked(requestUrl).mockRejectedValue(mock);
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
      vi.mocked(requestUrl).mockRejectedValue(mock);
      await expect(service.getTrack(mockTrackId)).rejects.toThrow(error);
    });

    it.each([
      { error: "Track not found", mock: { status: 404 } },
      {
        error: "Rate limited. Try again in 60 seconds",
        mock: {
          headers: { "retry-after": "60" },
          status: 429,
        },
      },
      {
        error: "Rate limited. Try again in unknown seconds",
        mock: {
          headers: {},
          status: 429,
        },
      },
      {
        error: "Failed to fetch track: 500",
        mock: { status: 500 },
      },
    ])('should throw "$error" error', async ({ error, mock }) => {
      expect.hasAssertions();
      mockAuthRequest().mockRejectedValueOnce(mock);
      await expect(service.getTrack(mockTrackId)).rejects.toThrow(error);
    });

    it.each([
      {
        error: "Failed to fetch track data: Network timeout",
        mock: new Error("Network timeout"),
      },
      {
        error: "Failed to fetch track data: String error",
        mock: "String error",
      },
    ])('should throw "$error" error', async ({ error, mock }) => {
      expect.hasAssertions();
      mockAuthRequest().mockRejectedValueOnce(mock);
      await expect(service.getTrack(mockTrackId)).rejects.toThrow(error);
    });
  });
});
