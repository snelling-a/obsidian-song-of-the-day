import SongOfTheDayPlugin from "main";
import { App } from "obsidian";
import { DEFAULT_SETTINGS } from "src/settings/constants";
import { SongOfTheDaySettings } from "src/settings/types";

/**
 * Options for customizing the mock plugin.
 */
export type MockPluginOptions = Partial<SongOfTheDaySettings>;

/**
 * Creates a mock plugin instance for testing.
 * @param options Optional settings overrides
 */
export function createMockPlugin(
  options: MockPluginOptions = {},
): SongOfTheDayPlugin {
  return {
    addCommand: () => undefined,
    app: new App(),
    getSpotifyService: () => null,
    saveSettings: async () => undefined,
    settings: { ...DEFAULT_SETTINGS, ...options },
  } as unknown as SongOfTheDayPlugin;
}
