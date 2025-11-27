import { Track } from "@spotify/web-api-ts-sdk";

const MOCK_TRACK_ID = "5YAeJ0Cjg5yt2OYfGHYlOc";

/**
 * Mock Spotify track data for testing.
 * Represents "Purple Rain" by Prince & The Revolution.
 */
export const mockSpotifyTrack: Track = {
  album: {
    images: [
      { height: 640, url: "https://example.com/cover-large.jpg", width: 640 },
      { height: 300, url: "https://example.com/cover-medium.jpg", width: 300 },
      { height: 64, url: "https://example.com/cover-small.jpg", width: 64 },
    ],
    name: "Purple Rain",
    release_date: "1984-06-25",
  },
  artists: [{ name: "Prince" }, { name: "The Revolution" }],
  duration_ms: 498_000,
  external_urls: { spotify: `https://open.spotify.com/track/${MOCK_TRACK_ID}` },
  id: MOCK_TRACK_ID,
  name: "Purple Rain",
} as Track;
