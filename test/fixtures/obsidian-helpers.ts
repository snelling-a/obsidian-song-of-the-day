import { TFile, TFolder } from "obsidian";

/**
 * Creates a mock TFile instance that passes instanceof checks.
 * @param path The file path
 */
export function createMockTFile(path: string): TFile {
  // eslint-disable-next-line obsidianmd/no-tfile-tfolder-cast -- Required for test mocking
  const file = Object.create(TFile.prototype) as TFile;
  file.path = path;
  file.name = path.split("/").pop() ?? "";
  file.basename = file.name.replace(/\.md$/, "");
  file.extension = "md";

  return file;
}

/**
 * Creates a mock TFolder instance that passes instanceof checks.
 * @param path The folder path
 */
export function createMockTFolder(path: string): TFolder {
  // eslint-disable-next-line obsidianmd/no-tfile-tfolder-cast -- Required for test mocking
  const folder = Object.create(TFolder.prototype) as TFolder;
  folder.path = path;

  return folder;
}
