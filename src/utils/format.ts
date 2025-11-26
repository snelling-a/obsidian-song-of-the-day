import { NOTE_NAME_CASING, NOTE_NAME_STRUCTURE } from "src/settings/constants";
import { NoteNameCasing, NoteNameStructure } from "src/settings/types";

/**
 * Formats the file name by building structure and applying casing.
 * @param songTitle The track name from Spotify
 * @param artistName The primary artist from Spotify
 * @param structure The structure format to apply
 * @param casing The casing format to apply
 * @returns The formatted filename
 */
export function formatFileName(
  songTitle: string,
  artistName: string,
  structure: NoteNameStructure,
  casing: NoteNameCasing,
): string {
  const structuredName = buildNoteNameStructure(
    songTitle,
    artistName,
    structure,
  );

  return applyCasing(structuredName, casing);
}

/**
 * Returns a human-readable label for a note name casing.
 * @param casing The casing type
 * @returns A descriptive label for the casing
 */
export function getNoteNameCasingLabel(casing: NoteNameCasing): string {
  const example = "I Would Die 4 U";

  switch (casing) {
    case NOTE_NAME_CASING.KEBAB_CASE: {
      return `kebab-case (${applyCasing(example, casing)})`;
    }
    case NOTE_NAME_CASING.ORIGINAL: {
      return `Original (${example})`;
    }
    case NOTE_NAME_CASING.SNAKE_CASE: {
      return `snake_case (${applyCasing(example, casing)})`;
    }
    default: {
      return casing;
    }
  }
}

/**
 * Returns a human-readable label for a note name structure.
 * @param structure The structure type
 * @returns A descriptive label for the structure
 */
export function getNoteNameStructureLabel(
  structure: NoteNameStructure,
): string {
  const exampleSong = "I Would Die 4 U";
  const exampleArtist = "Prince";

  switch (structure) {
    case NOTE_NAME_STRUCTURE.ARTIST_SONG: {
      return `Artist - Song (${exampleArtist} - ${exampleSong})`;
    }
    case NOTE_NAME_STRUCTURE.SONG_ARTIST: {
      return `Song - Artist (${exampleSong} - ${exampleArtist})`;
    }
    case NOTE_NAME_STRUCTURE.SONG_ONLY: {
      return `Song only (${exampleSong})`;
    }
    default: {
      return structure;
    }
  }
}

/**
 * Applies casing format to a note name.
 * @param noteName The note name to format
 * @param casing The casing format to apply
 * @returns The formatted note name
 */
function applyCasing(noteName: string, casing: NoteNameCasing): string {
  switch (casing) {
    case NOTE_NAME_CASING.KEBAB_CASE: {
      return noteName
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, "-")
        .replaceAll(/^-+|-+$/g, "");
    }
    case NOTE_NAME_CASING.SNAKE_CASE: {
      return noteName
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, "_")
        .replaceAll(/^_+|_+$/g, "");
    }
    case NOTE_NAME_CASING.ORIGINAL:
    default: {
      return noteName.trim();
    }
  }
}

/**
 * Builds the note name structure with song and artist.
 * @param songTitle The track name from Spotify
 * @param artistName The primary artist from Spotify
 * @param structure The structure format to apply
 * @returns The structured note name
 */
function buildNoteNameStructure(
  songTitle: string,
  artistName: string,
  structure: NoteNameStructure,
): string {
  switch (structure) {
    case NOTE_NAME_STRUCTURE.ARTIST_SONG: {
      return `${artistName} - ${songTitle}`;
    }
    case NOTE_NAME_STRUCTURE.SONG_ARTIST: {
      return `${songTitle} - ${artistName}`;
    }
    case NOTE_NAME_STRUCTURE.SONG_ONLY:
    default: {
      return songTitle;
    }
  }
}
