import { NOTE_NAME_FORMAT, NoteNameFormat } from "../constants/settings";

/**
 * Formats the file name based on the selected format.
 * @param title - The original title to format
 * @param format - The format type to apply
 * @returns The formatted filename
 */
export function formatFileName(title: string, format: NoteNameFormat): string {
  let formattedFileName = title.trim();

  switch (format) {
    case NOTE_NAME_FORMAT.KEBAB_CASE:
      formattedFileName = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      break;
    case NOTE_NAME_FORMAT.SNAKE_CASE:
      formattedFileName = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
      break;
    case NOTE_NAME_FORMAT.ORIGINAL:
    default:
      break;
  }

  return formattedFileName;
}

/**
 * Returns a human-readable label for a note name format.
 * @param format - The format type
 * @returns A descriptive label for the format
 */
export function getNoteNameFormatLabel(format: NoteNameFormat): string {
  const exampleTitle = "I Would Die 4 U";
  const formattedExample = formatFileName(exampleTitle, format);

  switch (format) {
    case NOTE_NAME_FORMAT.KEBAB_CASE:
      return `kebab-case (${formattedExample})`;
    case NOTE_NAME_FORMAT.ORIGINAL:
      return `Original (${formattedExample})`;
    case NOTE_NAME_FORMAT.SNAKE_CASE:
      return `snake_case (${formattedExample})`;
    default:
      return format;
  }
}
