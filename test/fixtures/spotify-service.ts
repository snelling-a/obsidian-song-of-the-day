import type { SpotifyService } from "src/services/spotify";

import { vi } from "vitest";

import { mockSpotifyTrack } from "./spotify-track";

/**
 * Partial mock of SpotifyService for testing.
 */
export type MockSpotifyService = Partial<SpotifyService>;

/**
 * Options for customizing the mock SpotifyService behavior.
 */
export interface MockSpotifyServiceOptions {
  addTrackError?: Error | string;
  getTrackError?: Error | string;
  isAuthenticated?: boolean;
  trackId?: null | string;
}

/**
 * Creates a mock SpotifyService for testing.
 * @param options Configuration for mock behavior
 */
export function createMockSpotifyService(
  options: MockSpotifyServiceOptions = {},
): MockSpotifyService {
  const {
    addTrackError,
    getTrackError,
    isAuthenticated = true,
    trackId = "test-track-id",
  } = options;

  const mockAddTrackToPlaylist = addTrackError
    ? vi.fn<SpotifyService["addTrackToPlaylist"]>().mockRejectedValue(addTrackError)
    : vi.fn<SpotifyService["addTrackToPlaylist"]>().mockResolvedValue(undefined);

  const mockGetTrack = getTrackError
    ? vi.fn<SpotifyService["getTrack"]>().mockRejectedValue(getTrackError)
    : vi.fn<SpotifyService["getTrack"]>().mockResolvedValue(mockSpotifyTrack);

  return {
    addTrackToPlaylist: mockAddTrackToPlaylist,
    extractTrackId: vi.fn<SpotifyService["extractTrackId"]>().mockReturnValue(trackId),
    getTrack: mockGetTrack,
    isUserAuthenticated: vi
      .fn<SpotifyService["isUserAuthenticated"]>()
      .mockReturnValue(isAuthenticated),
  };
}
