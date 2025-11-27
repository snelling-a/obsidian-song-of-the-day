import SongOfTheDayPlugin from "main";
import { DEFAULT_SETTINGS } from "src/settings/constants";

/**
 * Creates a mock plugin instance for testing.
 * Contains minimal settings configuration.
 */
export const createMockPlugin = (): SongOfTheDayPlugin => {
  return {
    settings: DEFAULT_SETTINGS,
  } as SongOfTheDayPlugin;
};
