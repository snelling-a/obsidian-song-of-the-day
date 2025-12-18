import { TFile, TFolder } from "obsidian";
import { vi } from "vitest";

import { createMockTFile } from "./obsidian-helpers";

/**
 * Partial mock of Obsidian App for testing.
 */
export interface MockApp {
  fileManager: {
    processFrontMatter: ReturnType<typeof vi.fn>;
  };
  setting: {
    open: ReturnType<typeof vi.fn>;
    openTabById: ReturnType<typeof vi.fn>;
  };
  vault: {
    create: ReturnType<typeof vi.fn>;
    createFolder: ReturnType<typeof vi.fn>;
    getAbstractFileByPath: ReturnType<typeof vi.fn>;
  };
  workspace: {
    getLeaf: ReturnType<typeof vi.fn>;
  };
}

/**
 * Options for customizing the mock app behavior.
 */
export interface MockAppOptions {
  createFolderError?: Error;
  existingFile?: TFile;
  existingFolder?: TFolder;
}

/**
 * Creates a mock Obsidian App for testing.
 * @param options Configuration for mock behavior
 */
export function createMockApp(options: MockAppOptions = {}): MockApp {
  const { createFolderError, existingFile, existingFolder } = options;

  const mockGetAbstractFileByPath = vi
    .fn<(path: string) => TFile | TFolder | null>()
    .mockImplementation((path: string) => {
      if (existingFile && path === existingFile.path) {
        return existingFile;
      }
      if (existingFolder && path === existingFolder.path) {
        return existingFolder;
      }

      return null;
    });

  const mockCreateFolder = createFolderError
    ? vi.fn<(path: string) => Promise<void>>().mockRejectedValue(createFolderError)
    : vi.fn<(path: string) => Promise<void>>().mockResolvedValue(undefined);

  return {
    fileManager: {
      processFrontMatter: vi.fn().mockResolvedValue(undefined),
    },
    setting: {
      open: vi.fn<() => void>(),
      openTabById: vi.fn<(id: string) => void>(),
    },
    vault: {
      create: vi.fn().mockResolvedValue(createMockTFile("test.md")),
      createFolder: mockCreateFolder,
      getAbstractFileByPath: mockGetAbstractFileByPath,
    },
    workspace: {
      getLeaf: vi.fn().mockReturnValue({
        openFile: vi.fn().mockResolvedValue(undefined),
      }),
    },
  };
}
