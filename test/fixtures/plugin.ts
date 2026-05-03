import SongOfTheDayPlugin from "main";
import { App } from "obsidian";
import { DEFAULT_SETTINGS } from "src/settings/constants";
import { SongOfTheDaySettings } from "src/settings/types";
import { vi } from "vitest";

/**
 * Options for customizing the mock plugin.
 */
export type MockPluginOptions = Partial<SongOfTheDaySettings> & {
  secretStorage?: {
    getSecret?: (key: string) => string | null;
    setSecret?: (key: string, value: string) => void;
  };
};

/**
 * Creates a mock plugin instance for testing.
 * @param options Optional settings overrides
 */
export function createMockPlugin(
  options: MockPluginOptions = {},
): SongOfTheDayPlugin {
  const { secretStorage, ...settingsOptions } = options;

  // Create a mock app with secretStorage and setting
  const mockApp = {
    secretStorage: {
      getSecret: vi.fn<(key: string) => string | null>().mockImplementation(
        (key: string) => secretStorage?.getSecret?.(key) ?? null,
      ),
      setSecret: vi.fn<(key: string, value: string) => void>().mockImplementation(
        (key: string, value: string) => secretStorage?.setSecret?.(key, value),
      ),
    },
    setting: {
      open: vi.fn<() => void>(),
      openTabById: vi.fn<(id: string) => void>(),
    },
  };

  return {
    addCommand: () => undefined,
    app: mockApp,
    getSpotifyService: () => null,
    saveSettings: async () => undefined,
    settings: { ...DEFAULT_SETTINGS, ...settingsOptions },
  } as unknown as SongOfTheDayPlugin;
}
