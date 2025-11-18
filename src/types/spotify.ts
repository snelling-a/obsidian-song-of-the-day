/**
 * Spotify Web API type definitions.
 *
 * These types represent the data structures returned by the Spotify Web API,
 * enabling type-safe interaction with track, album, and artist data.
 *
 * Source: Spotify Web API TypeScript SDK
 * @see https://github.com/spotify/spotify-web-api-ts-sdk/blob/main/src/types.ts
 *
 * Note: These types have been extracted and adapted for use in this plugin.
 * Only the types necessary for track and album data have been included.
 */

export interface Copyright {
  text: string;
  type: string;
}

export interface ExternalIds {
  upc: string;
}

export interface ExternalUrls {
  spotify: string;
}

export interface Image {
  height: number;
  url: string;
  width: number;
}

export interface LinkedFrom {
  external_urls: ExternalUrls;
  href: string;
  id: string;
  type: string;
  uri: string;
}

export interface Restrictions {
  reason: string;
}

export interface SimplifiedArtist {
  external_urls: ExternalUrls;
  href: string;
  id: string;
  name: string;
  type: string;
  uri: string;
}

export interface Track extends SimplifiedTrack {
  album: SimplifiedAlbum;
  external_ids: ExternalIds;
  popularity: number;
}

interface AlbumBase {
  album_type: string;
  available_markets: string[];
  copyrights: Copyright[];
  external_ids: ExternalIds;
  external_urls: ExternalUrls;
  genres: string[];
  href: string;
  id: string;
  images: Image[];
  label: string;
  name: string;
  popularity: number;
  release_date: string;
  release_date_precision: "day" | "month" | "year";
  restrictions?: Restrictions;
  total_tracks: number;
  type: string;
  uri: string;
}
interface SimplifiedAlbum extends AlbumBase {
  album_group: string;
  artists: SimplifiedArtist[];
}

interface SimplifiedTrack {
  artists: SimplifiedArtist[];
  available_markets: string[];
  disc_number: number;
  duration_ms: number;
  episode: boolean;
  explicit: boolean;
  external_urls: ExternalUrls;
  href: string;
  id: string;
  is_local: boolean;
  is_playable?: boolean;
  linked_from?: LinkedFrom;
  name: string;
  preview_url: null | string;
  restrictions?: Restrictions;
  track: boolean;
  track_number: number;
  type: string;
  uri: string;
}
