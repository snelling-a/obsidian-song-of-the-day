import { Plugin } from "obsidian";

import type { SpotifyService } from "./services/spotify";

import { registerCommands } from "./commands";
import { DEFAULT_SETTINGS } from "./constants/settings";
import { getOrCreateSpotifyService } from "./services/spotify-manager";
import { SongOfTheDaySettingTab } from "./settings";
import { SongOfTheDaySettings } from "./types/settings";

export default class SongOfTheDayPlugin extends Plugin {
  settings!: SongOfTheDaySettings;
  private settingTab: null | SongOfTheDaySettingTab = null;
  private spotifyService: null | SpotifyService = null;

  /**
   * Gets or creates a Spotify service instance
   * @returns Configured Spotify service, or null if credentials not set
   */
  getSpotifyService(): null | SpotifyService {
    this.spotifyService = getOrCreateSpotifyService(
      this.settings,
      this.app,
      this.spotifyService,
    );
    return this.spotifyService;
  }

  /**
   * Loads plugin settings from disk and merges with defaults
   */
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async onload() {
    await this.loadSettings();

    registerCommands(this);

    this.settingTab = new SongOfTheDaySettingTab(this.app, this);
    this.addSettingTab(this.settingTab);
  }

  onunload() {}

  /**
   * Saves plugin settings to disk and resets the Spotify service to pick up credential changes
   */
  async saveSettings() {
    await this.saveData(this.settings);
    this.spotifyService = null;
  }
}
