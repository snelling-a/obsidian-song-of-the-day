import { Plugin } from "obsidian";
import { registerCommands } from "src/commands";
import { SpotifyService } from "src/services/spotify";
import { getOrCreateSpotifyService } from "src/services/spotify/spotify-manager";
import { SongOfTheDaySettingTab } from "src/settings";
import { DEFAULT_SETTINGS } from "src/settings/constants";
import { SongOfTheDaySettings } from "src/settings/types";

import pkg from "./package.json";

/** Main plugin class */
export default class SongOfTheDayPlugin extends Plugin {
  public settings!: SongOfTheDaySettings;
  private settingTab: null | SongOfTheDaySettingTab = null;
  private spotifyService: null | SpotifyService = null;

  /**
   * Gets or creates a Spotify service instance.
   * @returns Configured Spotify service, or null if credentials not set
   */
  public getSpotifyService(): null | SpotifyService {
    this.spotifyService = getOrCreateSpotifyService(this);

    return this.spotifyService;
  }

  /** @inheritdoc */
  public async onload(): Promise<void> {
    console.debug(`[${pkg.name}] v${pkg.version} loaded`);
    await this.loadSettings();
    registerCommands(this);
    this.settingTab = new SongOfTheDaySettingTab(this.app, this);
    this.addSettingTab(this.settingTab);
  }

  /** @inheritdoc */
  public onunload(): void {
    //
  }

  /**
   * Saves plugin settings to disk and resets the Spotify service to pick up credential changes.
   */
  public async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.spotifyService = null;
  }

  /**
   * Loads plugin settings from disk and merges with defaults.
   */
  private async loadSettings(): Promise<void> {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      (await this.loadData()) as Partial<SongOfTheDaySettings>,
    );
  }
}
