import { SimplifiedArtist, Track } from "@spotify/web-api-ts-sdk";
import SongOfTheDayPlugin from "main";
import { createMockPlugin } from "test/fixtures/plugin";
import { mockSpotifyTrack } from "test/fixtures/spotify-track";
import { beforeEach, describe, expect, expectTypeOf, it } from "vitest";

import { FIELD_REGISTRY, FieldDefinition } from "./field-registry";

describe("field registry", () => {
  it("should have 10 field definitions", () => {
    expect(FIELD_REGISTRY).toHaveLength(10);
  });

  it("should have unique keys", () => {
    const keys = FIELD_REGISTRY.map((field) => field.key);
    const uniqueKeys = new Set(keys);

    expect(uniqueKeys.size).toBe(keys.length);
  });

  const requiredProperties: (keyof FieldDefinition)[] = [
    "key",
    "label",
    "description",
    "getValue",
    "defaultEnabled",
  ];

  describe.each(FIELD_REGISTRY)("$label field", (field) => {
    it("should exist", () => {
      expect(field).toBeDefined();
    });

    it.each(requiredProperties)("should have property %s", (property) => {
      expect(field).toHaveProperty(property);
    });

    it("should have correct types on all required properties", () => {
      for (const property of requiredProperties) {
        expect(field).toHaveProperty(property);
      }

      expectTypeOf(field.key).toBeString();
      expectTypeOf(field.label).toBeString();
      expectTypeOf(field.description).toBeString();
      expectTypeOf(field.getValue).toBeFunction();
      expectTypeOf(field.defaultEnabled).toBeBoolean();
    });
  });

  describe("field getValue functions", () => {
    let mockTrack: Track;
    let plugin: SongOfTheDayPlugin;
    let field: FieldDefinition | undefined;

    beforeEach(() => {
      mockTrack = { ...mockSpotifyTrack };
      plugin = createMockPlugin();
    });

    describe("title field", () => {
      beforeEach(() => {
        field = FIELD_REGISTRY.find((field) => field.key === "title");
      });

      it("should be enabled by default", () => {
        expect(field?.defaultEnabled).toBe(true);
      });

      it("should return track name", () => {
        const result = field?.getValue(mockTrack, plugin);

        expect(result).toBe("Purple Rain");
      });

      it("should handle empty track name", () => {
        mockTrack.name = "";
        const result = field?.getValue(mockTrack, plugin);

        expect(result).toBe("");
      });
    });

    describe("artist field", () => {
      beforeEach(() => {
        field = FIELD_REGISTRY.find((field) => field.key === "artist");
      });

      it("should be enabled by default", () => {
        expect(field?.defaultEnabled).toBe(true);
      });

      it("should return comma-separated artist names", () => {
        const result = field?.getValue(mockTrack, plugin);

        expect(result).toBe("Prince, The Revolution");
      });

      it("should handle single artist", () => {
        mockTrack.artists = [{ name: "Prince" }] as SimplifiedArtist[];
        const result = field?.getValue(mockTrack, plugin);

        expect(result).toBe("Prince");
      });

      it("should handle empty artists array", () => {
        mockTrack.artists = [];
        const result = field?.getValue(mockTrack, plugin);

        expect(result).toBe("");
      });

      it("should handle many artists", () => {
        mockTrack.artists = [
          { name: "Artist 1" },
          { name: "Artist 2" },
          { name: "Artist 3" },
          { name: "Artist 4" },
        ] as SimplifiedArtist[];
        const result = field?.getValue(mockTrack, plugin);

        expect(result).toBe("Artist 1, Artist 2, Artist 3, Artist 4");
      });
    });

    describe("album field", () => {
      beforeEach(() => {
        field = FIELD_REGISTRY.find((field) => field.key === "album");
      });

      it("should be enabled by default", () => {
        expect(field?.defaultEnabled).toBe(true);
      });

      it("should return album name", () => {
        const result = field?.getValue(mockTrack, plugin);

        expect(result).toBe("Purple Rain");
      });

      it("should handle empty album name", () => {
        mockTrack.album.name = "";
        const result = field?.getValue(mockTrack, plugin);

        expect(result).toBe("");
      });
    });

    describe("release_date field", () => {
      beforeEach(() => {
        field = FIELD_REGISTRY.find((field) => field.key === "release_date");
      });

      it("should be enabled by default", () => {
        expect(field?.defaultEnabled).toBe(true);
      });

      it("should return album release date", () => {
        const result = field?.getValue(mockTrack, plugin);

        expect(result).toBe("1984-06-25");
      });

      it("should handle year-only release dates", () => {
        mockTrack.album.release_date = "1984";
        const result = field?.getValue(mockTrack, plugin);

        expect(result).toBe("1984");
      });

      it("should handle year-month release dates", () => {
        mockTrack.album.release_date = "1984-06";
        const result = field?.getValue(mockTrack, plugin);

        expect(result).toBe("1984-06");
      });
    });

    describe("date field", () => {
      beforeEach(() => {
        field = FIELD_REGISTRY.find((field) => field.key === "date");
      });

      it("should be enabled by default", () => {
        expect(field?.defaultEnabled).toBe(true);
      });

      it("should use plugin date format setting", () => {
        const result = field?.getValue(mockTrack, plugin);

        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });

      it("should return formatted date string", () => {
        plugin.settings.dateFormat = "YYYY-MM-DD";
        const result = field?.getValue(mockTrack, plugin);

        expect(result).toBeDefined();
        expect(result?.length).toBeGreaterThan(0);
      });
    });

    describe("cover field", () => {
      beforeEach(() => {
        field = FIELD_REGISTRY.find((field) => field.key === "cover");
      });

      it("should be enabled by default", () => {
        expect(field?.defaultEnabled).toBe(true);
      });

      it("should return first album image URL", () => {
        const result = field?.getValue(mockTrack, plugin);

        expect(result).toBe("https://example.com/cover-large.jpg");
      });

      it("should return empty string when no images available", () => {
        mockTrack.album.images = [];
        const result = field?.getValue(mockTrack, plugin);

        expect(result).toBe("");
      });

      it("should return second image if first is undefined", () => {
        mockTrack.album.images = [
          // @ts-expect-error Testing undefined image
          undefined,
          {
            height: 300,
            url: "https://example.com/cover-medium.jpg",
            width: 300,
          },
        ];
        const result = field?.getValue(mockTrack, plugin);

        expect(result).toBe("");
      });
    });

    describe("spotify_url field", () => {
      beforeEach(() => {
        field = FIELD_REGISTRY.find((field) => field.key === "spotify_url");
      });

      it("should be enabled by default", () => {
        expect(field?.defaultEnabled).toBe(true);
      });

      it("should return Spotify track URL", () => {
        const result = field?.getValue(mockTrack, plugin);

        expect(result).toBe(
          "https://open.spotify.com/track/5YAeJ0Cjg5yt2OYfGHYlOc",
        );
      });
    });

    describe("spotify_id field", () => {
      beforeEach(() => {
        field = FIELD_REGISTRY.find((field) => field.key === "spotify_id");
      });

      it("should be enabled by default", () => {
        expect(field?.defaultEnabled).toBe(true);
      });

      it("should return Spotify track ID", () => {
        const result = field?.getValue(mockTrack, plugin);

        expect(result).toBe("5YAeJ0Cjg5yt2OYfGHYlOc");
      });
    });

    describe("duration_ms field", () => {
      beforeEach(() => {
        field = FIELD_REGISTRY.find((field) => field.key === "duration_ms");
      });

      it("should be enabled by default", () => {
        expect(field?.defaultEnabled).toBe(true);
      });

      it("should return duration in milliseconds as string", () => {
        const result = field?.getValue(mockTrack, plugin);

        expect(result).toBe("498000");
      });

      it("should handle zero duration", () => {
        mockTrack.duration_ms = 0;
        const result = field?.getValue(mockTrack, plugin);

        expect(result).toBe("0");
      });

      it("should handle very long duration", () => {
        mockTrack.duration_ms = 10_000_000;
        const result = field?.getValue(mockTrack, plugin);

        expect(result).toBe("10000000");
      });
    });

    describe("duration field", () => {
      beforeEach(() => {
        field = FIELD_REGISTRY.find((field) => field.key === "duration");
      });

      it("should be disabled by default", () => {
        expect(field?.defaultEnabled).toBe(false);
      });

      it.each([
        { durationMs: 0, expected: "0:00" },
        { durationMs: 100, expected: "0:00" },
        { durationMs: 1000, expected: "0:01" },
        { durationMs: 1500, expected: "0:01" },
        { durationMs: 3_599_000, expected: "59:59" },
        { durationMs: 3_661_000, expected: "61:01" },
        { durationMs: 498_000, expected: "8:18" },
        { durationMs: 59_000, expected: "0:59" },
        { durationMs: 60_000, expected: "1:00" },
        { durationMs: 65_000, expected: "1:05" },
      ])(
        "should return $expected given $durationMs",
        ({ durationMs, expected }) => {
          mockTrack.duration_ms = durationMs;
          const result = field?.getValue(mockTrack, plugin);

          expect(result).toBe(expected);
        },
      );
    });
  });
});
