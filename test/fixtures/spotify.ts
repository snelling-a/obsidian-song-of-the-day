/**
 * Mock data for Spotify API responses used in tests.
 */

import { SPOTIFY_BASE_URL } from "src/services/spotify";
import { Track } from "src/types/spotify";
import { exampleTitle } from "src/utils/format";

export const mockTrackId = "6rqhFgbbKwnb9MLmUQDhG6";

export const mockAuthResponse = {
  access_token: "mock-token",
  expires_in: 3600,
};

export const mockTrackResponse: Track = {
  album: {
    album_group: "single",
    album_type: "single",
    artists: [
      {
        external_urls: { spotify: "https://open.spotify.com/artist/123" },
        href: `${SPOTIFY_BASE_URL}/artists/123`,
        id: "123",
        name: "Test Artist",
        type: "artist",
        uri: "spotify:artist:123",
      },
    ],
    available_markets: ["US"],
    copyrights: [{ text: "Test Copyright", type: "C" }],
    external_ids: { upc: "123456789" },
    external_urls: { spotify: "https://open.spotify.com/album/456" },
    genres: [],
    href: `${SPOTIFY_BASE_URL}/albums/456`,
    id: "456",
    images: [{ height: 640, url: "https://example.com/image.jpg", width: 640 }],
    label: "Test Label",
    name: "Test Album",
    popularity: 50,
    release_date: "2024-01-01",
    release_date_precision: "day",
    total_tracks: 1,
    type: "album",
    uri: "spotify:album:456",
  },
  artists: [
    {
      external_urls: { spotify: "https://open.spotify.com/artist/123" },
      href: `${SPOTIFY_BASE_URL}/artists/123`,
      id: "123",
      name: "Test Artist",
      type: "artist",
      uri: "spotify:artist:123",
    },
  ],
  available_markets: ["US"],
  disc_number: 1,
  duration_ms: 180000,
  episode: false,
  explicit: false,
  external_ids: { upc: "123456789" },
  external_urls: { spotify: "https://open.spotify.com/track/789" },
  href: `${SPOTIFY_BASE_URL}/tracks/789`,
  id: "789",
  is_local: false,
  name: exampleTitle,
  popularity: 75,
  preview_url: null,
  track: true,
  track_number: 1,
  type: "track",
  uri: "spotify:track:789",
};
