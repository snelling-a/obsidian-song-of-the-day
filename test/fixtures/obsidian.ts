/**
 * Mock data for Obsidian API objects used in tests.
 */

import type {
  App,
  FileManager,
  Vault,
  Workspace,
  WorkspaceLeaf,
} from "obsidian";
import type SongOfTheDayPlugin from "src/main";
import type { SpotifyService } from "src/services/spotify";

import { TFile } from "obsidian";
import { mockValidSettings } from "test/fixtures/settings";
import { vi } from "vitest";

/**
 * Shared mock file instance used across tests.
 * Automatically reset between tests via vitest config.
 */
export const mockFile = Object.assign(new TFile(), {
  path: "Music/test-song.md",
});

/**
 * Shared mock leaf instance used across tests.
 * Automatically reset between tests via vitest config.
 */
export const mockLeaf: WorkspaceLeaf = {
  openFile: vi.fn(),
} as unknown as WorkspaceLeaf;

/**
 * Creates a mock Obsidian App instance for testing.
 * @returns A new mock on each call to ensure test isolation.
 */
export function createMockApp(): App {
  return {
    setting: {
      open: vi.fn(),
      openTabById: vi.fn(),
    },
  } as unknown as App;
}

/**
 * Creates a mock DocumentFragment with Obsidian's DOM extension methods.
 * Obsidian extends DocumentFragment with helper methods like appendText, createDiv, and createEl.
 * @returns DocumentFragment with Obsidian-specific DOM extensions
 */
export function createMockDocumentFragment(): DocumentFragment {
  const fragment = document.createDocumentFragment();

  fragment.appendText = (text: string) => {
    fragment.appendChild(document.createTextNode(text));
  };

  fragment.createDiv = (options?: { text?: string }) => {
    const div = document.createElement("div");

    if (options?.text) {
      div.textContent = options.text;
    }
    fragment.appendChild(div);

    div.appendText = (text: string) => {
      div.appendChild(document.createTextNode(text));
    };

    div.createDiv = (options?: { text?: string }) => {
      const childDiv = document.createElement("div");

      if (options?.text) {
        childDiv.textContent = options.text;
      }
      div.appendChild(childDiv);

      childDiv.appendText = (text: string) => {
        childDiv.appendChild(document.createTextNode(text));
      };

      childDiv.createEl = <K extends keyof HTMLElementTagNameMap>(
        tag: K,
        options?: { text?: string },
      ) => {
        const el = document.createElement(tag);

        if (options?.text) {
          el.textContent = options.text;
        }
        childDiv.appendChild(el);

        return el;
      };

      return childDiv;
    };

    return div;
  };

  return fragment;
}

/**
 * Creates a mock SongOfTheDayPlugin instance for testing.
 * @param overrides - Optional properties to override defaults
 * @returns Mock plugin instance
 */
export function createMockPlugin(
  overrides?: Partial<SongOfTheDayPlugin>,
): SongOfTheDayPlugin {
  const defaultPlugin: Partial<SongOfTheDayPlugin> = {
    addCommand: vi.fn(),
    app: {
      fileManager: {
        processFrontMatter: vi.fn((_, callback) => {
          callback({});

          return Promise.resolve();
        }),
      } as unknown as FileManager,
      vault: {
        create: vi.fn(() => Promise.resolve(mockFile)),
        createFolder: vi.fn(() =>
          Promise.resolve(),
        ) as unknown as Vault["createFolder"],
        getAbstractFileByPath: vi.fn(() => null),
      } as unknown as Vault,
      workspace: {
        getLeaf: vi.fn(() => mockLeaf),
      } as unknown as Workspace,
    } as App,
    getSpotifyService: vi.fn(() => null),
    settings: mockValidSettings,
  };

  return {
    ...defaultPlugin,
    ...overrides,
    app: {
      ...defaultPlugin.app,
      ...overrides?.app,
    },
    settings: {
      ...defaultPlugin.settings,
      ...overrides?.settings,
    },
  } as SongOfTheDayPlugin;
}

/**
 * Creates a mock SpotifyService instance for testing.
 * @param overrides - Optional properties to override defaults
 * @returns A new mock service on each call to ensure test isolation
 */
export function createMockSpotifyService(
  overrides?: Partial<SpotifyService>,
): SpotifyService {
  return {
    extractTrackId: vi.fn<SpotifyService["extractTrackId"]>(),
    getTrack: vi.fn<SpotifyService["getTrack"]>(),
    ...overrides,
  } as SpotifyService;
}
