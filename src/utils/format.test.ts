import { NOTE_NAME_CASING, NOTE_NAME_STRUCTURE } from "src/settings/constants";
import { describe, expect, it } from "vitest";

import {
  formatFileName,
  getNoteNameCasingLabel,
  getNoteNameStructureLabel,
} from "./format";

describe(formatFileName, () => {
  it("should format with song-only structure and original casing", () => {
    const result = formatFileName(
      "Purple Rain",
      "Prince",
      NOTE_NAME_STRUCTURE.SONG_ONLY,
      NOTE_NAME_CASING.ORIGINAL,
    );

    expect(result).toBe("Purple Rain");
  });

  it("should format with artist-song structure and kebab-case", () => {
    const result = formatFileName(
      "Purple Rain",
      "Prince",
      NOTE_NAME_STRUCTURE.ARTIST_SONG,
      NOTE_NAME_CASING.KEBAB_CASE,
    );

    expect(result).toBe("prince-purple-rain");
  });

  it("should format with song-artist structure and snake_case", () => {
    const result = formatFileName(
      "Purple Rain",
      "Prince",
      NOTE_NAME_STRUCTURE.SONG_ARTIST,
      NOTE_NAME_CASING.SNAKE_CASE,
    );

    expect(result).toBe("purple_rain_prince");
  });

  it("should handle special characters in song title", () => {
    const result = formatFileName(
      "I Would Die 4 U",
      "Prince",
      NOTE_NAME_STRUCTURE.SONG_ONLY,
      NOTE_NAME_CASING.KEBAB_CASE,
    );

    expect(result).toBe("i-would-die-4-u");
  });

  it("should handle unicode characters", () => {
    const result = formatFileName(
      "Café del Mar",
      "Energy 52",
      NOTE_NAME_STRUCTURE.SONG_ONLY,
      NOTE_NAME_CASING.KEBAB_CASE,
    );

    expect(result).toBe("caf-del-mar");
  });

  it("should handle empty strings", () => {
    const result = formatFileName(
      "",
      "",
      NOTE_NAME_STRUCTURE.SONG_ONLY,
      NOTE_NAME_CASING.ORIGINAL,
    );

    expect(result).toBe("");
  });

  it("should handle very long names", () => {
    const longTitle = "A".repeat(200);
    const longArtist = "B".repeat(200);
    const result = formatFileName(
      longTitle,
      longArtist,
      NOTE_NAME_STRUCTURE.ARTIST_SONG,
      NOTE_NAME_CASING.KEBAB_CASE,
    );

    expect(result).toBe(`${"b".repeat(200)}-${"a".repeat(200)}`);
  });

  it("should handle names with only special characters", () => {
    const result = formatFileName(
      "!!!",
      "???",
      NOTE_NAME_STRUCTURE.ARTIST_SONG,
      NOTE_NAME_CASING.KEBAB_CASE,
    );

    expect(result).toBe("");
  });
});

describe(getNoteNameCasingLabel, () => {
  it("should return label for kebab-case", () => {
    const result = getNoteNameCasingLabel(NOTE_NAME_CASING.KEBAB_CASE);

    expect(result).toBe("kebab-case (i-would-die-4-u)");
  });

  it("should return label for original", () => {
    const result = getNoteNameCasingLabel(NOTE_NAME_CASING.ORIGINAL);

    expect(result).toBe("Original (I Would Die 4 U)");
  });

  it("should return label for snake_case", () => {
    const result = getNoteNameCasingLabel(NOTE_NAME_CASING.SNAKE_CASE);

    expect(result).toBe("snake_case (i_would_die_4_u)");
  });

  it("should return the casing value for unknown casing", () => {
    const result = getNoteNameCasingLabel(
      "unknown" as typeof NOTE_NAME_CASING.ORIGINAL,
    );

    expect(result).toBe("unknown");
  });
});

describe(getNoteNameStructureLabel, () => {
  it("should return label for artist-song structure", () => {
    const result = getNoteNameStructureLabel(NOTE_NAME_STRUCTURE.ARTIST_SONG);

    expect(result).toBe("Artist - Song (Prince - I Would Die 4 U)");
  });

  it("should return label for song-artist structure", () => {
    const result = getNoteNameStructureLabel(NOTE_NAME_STRUCTURE.SONG_ARTIST);

    expect(result).toBe("Song - Artist (I Would Die 4 U - Prince)");
  });

  it("should return label for song-only structure", () => {
    const result = getNoteNameStructureLabel(NOTE_NAME_STRUCTURE.SONG_ONLY);

    expect(result).toBe("Song only (I Would Die 4 U)");
  });

  it("should return the structure value for unknown structure", () => {
    const result = getNoteNameStructureLabel(
      "unknown" as typeof NOTE_NAME_STRUCTURE.SONG_ONLY,
    );

    expect(result).toBe("unknown");
  });
});

describe("formatFileName with kebab-case", () => {
  it("should convert to lowercase with dashes", () => {
    const result = formatFileName(
      "Purple Rain",
      "Prince",
      NOTE_NAME_STRUCTURE.SONG_ONLY,
      NOTE_NAME_CASING.KEBAB_CASE,
    );

    expect(result).toBe("purple-rain");
  });

  it("should replace multiple consecutive spaces with single dash", () => {
    const result = formatFileName(
      "Purple   Rain",
      "Prince",
      NOTE_NAME_STRUCTURE.SONG_ONLY,
      NOTE_NAME_CASING.KEBAB_CASE,
    );

    expect(result).toBe("purple-rain");
  });

  it("should remove leading and trailing dashes from whitespace", () => {
    const result = formatFileName(
      "   Purple Rain   ",
      "Prince",
      NOTE_NAME_STRUCTURE.SONG_ONLY,
      NOTE_NAME_CASING.KEBAB_CASE,
    );

    expect(result).toBe("purple-rain");
  });

  it("should replace special characters with dashes", () => {
    const result = formatFileName(
      "I Would Die 4 U!",
      "Prince",
      NOTE_NAME_STRUCTURE.SONG_ONLY,
      NOTE_NAME_CASING.KEBAB_CASE,
    );

    expect(result).toBe("i-would-die-4-u");
  });

  it("should handle strings with only special characters", () => {
    const result = formatFileName(
      "!@#$%^&*()",
      "Artist",
      NOTE_NAME_STRUCTURE.SONG_ONLY,
      NOTE_NAME_CASING.KEBAB_CASE,
    );

    expect(result).toBe("");
  });

  it("should preserve numbers", () => {
    const result = formatFileName(
      "Track 123",
      "Artist",
      NOTE_NAME_STRUCTURE.SONG_ONLY,
      NOTE_NAME_CASING.KEBAB_CASE,
    );

    expect(result).toBe("track-123");
  });

  it("should work with artist-song structure", () => {
    const result = formatFileName(
      "Purple Rain",
      "Prince & The Revolution",
      NOTE_NAME_STRUCTURE.ARTIST_SONG,
      NOTE_NAME_CASING.KEBAB_CASE,
    );

    expect(result).toBe("prince-the-revolution-purple-rain");
  });
});

describe("formatFileName with snake_case", () => {
  it("should convert to lowercase with underscores", () => {
    const result = formatFileName(
      "Purple Rain",
      "Prince",
      NOTE_NAME_STRUCTURE.SONG_ONLY,
      NOTE_NAME_CASING.SNAKE_CASE,
    );

    expect(result).toBe("purple_rain");
  });

  it("should replace multiple consecutive spaces with single underscore", () => {
    const result = formatFileName(
      "Purple   Rain",
      "Prince",
      NOTE_NAME_STRUCTURE.SONG_ONLY,
      NOTE_NAME_CASING.SNAKE_CASE,
    );

    expect(result).toBe("purple_rain");
  });

  it("should remove leading and trailing underscores from whitespace", () => {
    const result = formatFileName(
      "   Purple Rain   ",
      "Prince",
      NOTE_NAME_STRUCTURE.SONG_ONLY,
      NOTE_NAME_CASING.SNAKE_CASE,
    );

    expect(result).toBe("purple_rain");
  });

  it("should replace special characters with underscores", () => {
    const result = formatFileName(
      "I Would Die 4 U!",
      "Prince",
      NOTE_NAME_STRUCTURE.SONG_ONLY,
      NOTE_NAME_CASING.SNAKE_CASE,
    );

    expect(result).toBe("i_would_die_4_u");
  });

  it("should handle strings with only special characters", () => {
    const result = formatFileName(
      "!@#$%^&*()",
      "Artist",
      NOTE_NAME_STRUCTURE.SONG_ONLY,
      NOTE_NAME_CASING.SNAKE_CASE,
    );

    expect(result).toBe("");
  });

  it("should preserve numbers", () => {
    const result = formatFileName(
      "Track 123",
      "Artist",
      NOTE_NAME_STRUCTURE.SONG_ONLY,
      NOTE_NAME_CASING.SNAKE_CASE,
    );

    expect(result).toBe("track_123");
  });

  it("should work with song-artist structure", () => {
    const result = formatFileName(
      "Purple Rain",
      "Prince & The Revolution",
      NOTE_NAME_STRUCTURE.SONG_ARTIST,
      NOTE_NAME_CASING.SNAKE_CASE,
    );

    expect(result).toBe("purple_rain_prince_the_revolution");
  });
});

describe("formatFileName with original casing", () => {
  it("should preserve original casing and spacing", () => {
    const result = formatFileName(
      "Purple Rain",
      "Prince",
      NOTE_NAME_STRUCTURE.SONG_ONLY,
      NOTE_NAME_CASING.ORIGINAL,
    );

    expect(result).toBe("Purple Rain");
  });

  it("should trim leading whitespace", () => {
    const result = formatFileName(
      "   Purple Rain",
      "Prince",
      NOTE_NAME_STRUCTURE.SONG_ONLY,
      NOTE_NAME_CASING.ORIGINAL,
    );

    expect(result).toBe("Purple Rain");
  });

  it("should trim trailing whitespace", () => {
    const result = formatFileName(
      "Purple Rain   ",
      "Prince",
      NOTE_NAME_STRUCTURE.SONG_ONLY,
      NOTE_NAME_CASING.ORIGINAL,
    );

    expect(result).toBe("Purple Rain");
  });

  it("should preserve internal spacing", () => {
    const result = formatFileName(
      "Purple   Rain",
      "Prince",
      NOTE_NAME_STRUCTURE.SONG_ONLY,
      NOTE_NAME_CASING.ORIGINAL,
    );

    expect(result).toBe("Purple   Rain");
  });

  it("should preserve special characters", () => {
    const result = formatFileName(
      "I Would Die 4 U!",
      "Prince",
      NOTE_NAME_STRUCTURE.SONG_ONLY,
      NOTE_NAME_CASING.ORIGINAL,
    );

    expect(result).toBe("I Would Die 4 U!");
  });

  it("should work with artist-song structure", () => {
    const result = formatFileName(
      "Purple Rain",
      "Prince",
      NOTE_NAME_STRUCTURE.ARTIST_SONG,
      NOTE_NAME_CASING.ORIGINAL,
    );

    expect(result).toBe("Prince - Purple Rain");
  });

  it("should work with song-artist structure", () => {
    const result = formatFileName(
      "Purple Rain",
      "Prince",
      NOTE_NAME_STRUCTURE.SONG_ARTIST,
      NOTE_NAME_CASING.ORIGINAL,
    );

    expect(result).toBe("Purple Rain - Prince");
  });
});

describe("formatFileName structure tests", () => {
  it("should format with artist-song structure", () => {
    const result = formatFileName(
      "Purple Rain",
      "Prince",
      NOTE_NAME_STRUCTURE.ARTIST_SONG,
      NOTE_NAME_CASING.ORIGINAL,
    );

    expect(result).toBe("Prince - Purple Rain");
  });

  it("should format with song-artist structure", () => {
    const result = formatFileName(
      "Purple Rain",
      "Prince",
      NOTE_NAME_STRUCTURE.SONG_ARTIST,
      NOTE_NAME_CASING.ORIGINAL,
    );

    expect(result).toBe("Purple Rain - Prince");
  });

  it("should format with song-only structure", () => {
    const result = formatFileName(
      "Purple Rain",
      "Prince",
      NOTE_NAME_STRUCTURE.SONG_ONLY,
      NOTE_NAME_CASING.ORIGINAL,
    );

    expect(result).toBe("Purple Rain");
  });

  it("should handle empty artist with artist-song structure", () => {
    const result = formatFileName(
      "Purple Rain",
      "",
      NOTE_NAME_STRUCTURE.ARTIST_SONG,
      NOTE_NAME_CASING.KEBAB_CASE,
    );

    expect(result).toBe("purple-rain");
  });

  it("should handle empty song with song-artist structure", () => {
    const result = formatFileName(
      "",
      "Prince",
      NOTE_NAME_STRUCTURE.SONG_ARTIST,
      NOTE_NAME_CASING.KEBAB_CASE,
    );

    expect(result).toBe("prince");
  });

  it("should handle both empty with song-only structure", () => {
    const result = formatFileName(
      "",
      "",
      NOTE_NAME_STRUCTURE.SONG_ONLY,
      NOTE_NAME_CASING.KEBAB_CASE,
    );

    expect(result).toBe("");
  });
});
