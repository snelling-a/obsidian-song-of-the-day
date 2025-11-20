import { describe, expect, it } from "vitest";

import { NOTE_NAME_FORMAT, NoteNameFormat } from "../constants/settings";
import { formatFileName, getNoteNameFormatLabel } from "./format";

describe(formatFileName, () => {
  it("should handle empty string", () => {
    const result = formatFileName("", NOTE_NAME_FORMAT.ORIGINAL);

    expect(result).toBe("Untitled");
  });

  describe.each([
    { expected: "Hello World", format: NOTE_NAME_FORMAT.ORIGINAL },
    { expected: "hello-world", format: NOTE_NAME_FORMAT.KEBAB_CASE },
    { expected: "hello_world", format: NOTE_NAME_FORMAT.SNAKE_CASE },
  ])("format: $format", ({ expected, format }) => {
    it("should trim whitespace", () => {
      const result = formatFileName("  Hello World  ", format);

      expect(result).toBe(expected);
    });

    it("should handle special characters", () => {
      const result = formatFileName("Hello @ World!", format);

      expect(result).toBe(expected);
    });

    it.each(["-", "_"])("should remove leading and trailing '%s'", (char) => {
      const result = formatFileName(
        `${char.repeat(2)}Hello World${char.repeat(2)}`,
        format,
      );

      expect(result).toBe(expected);
    });
  });

  describe(`${NOTE_NAME_FORMAT.KEBAB_CASE} format`, () => {
    it("should collapse multiple special characters into single hyphen", () => {
      const result = formatFileName(
        "Hello   &&&   World!!!",
        NOTE_NAME_FORMAT.KEBAB_CASE,
      );

      expect(result).toBe("hello-world");
    });
  });

  describe(`${NOTE_NAME_FORMAT.SNAKE_CASE} format`, () => {
    it("should collapse multiple special characters into single underscore", () => {
      const result = formatFileName(
        "Hello   &&&   World!!!",
        NOTE_NAME_FORMAT.SNAKE_CASE,
      );

      expect(result).toBe("hello_world");
    });
  });
});

describe(getNoteNameFormatLabel, () => {
  it.each<{ expected: string; format: NoteNameFormat }>([
    {
      expected: "kebab-case (i-would-die-4-u)",
      format: NOTE_NAME_FORMAT.KEBAB_CASE,
    },
    {
      expected: "snake_case (i_would_die_4_u)",
      format: NOTE_NAME_FORMAT.SNAKE_CASE,
    },
    {
      expected: "Original (I Would Die 4 U)",
      format: NOTE_NAME_FORMAT.ORIGINAL,
    },
    {
      expected: "unknown_format",
      format: "unknown_format" as NoteNameFormat,
    },
  ])(
    "should return correct label for $format format",
    ({ expected, format }) => {
      const result = getNoteNameFormatLabel(format);

      expect(result).toBe(expected);
    },
  );
});
