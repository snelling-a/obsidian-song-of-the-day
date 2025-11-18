import { App, PluginSettingTab, Setting } from "obsidian";

import type SongOfTheDayPlugin from "./main";

import { CSS_CLASSES, CSS_VARIABLES } from "./constants/css";
import {
  DEFAULT_SETTINGS,
  MOMENT_FORMAT_DOCS_URL,
  NOTE_NAME_FORMAT,
  SPOTIFY_API_DOCS_URL,
} from "./constants/settings";
import { createTemplateVariablesFragment } from "./constants/template-variables";
import { FolderSuggest } from "./ui/folder-suggest";
import { TemplateSuggest } from "./ui/template-suggest";
import { getNoteNameFormatLabel } from "./utils/format";

export class SongOfTheDaySettingTab extends PluginSettingTab {
  readonly plugin: SongOfTheDayPlugin;
  private credentialsHelpEl: HTMLElement | null = null;

  /**
   * Creates the settings tab for the plugin.
   * @param app - The Obsidian application instance
   * @param plugin - The plugin instance
   */
  constructor(app: App, plugin: SongOfTheDayPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    this.containerEl.empty();

    this.createApiCredentialsHelp(this.containerEl);
    this.createSpotifyClientIdSetting(this.containerEl);
    this.createSpotifyClientSecretSetting(this.containerEl);

    new Setting(this.containerEl).setHeading().setName("Note Settings");

    this.createOutputFolderSetting(this.containerEl);
    this.createNoteNameFormatSetting(this.containerEl);
    this.createDateFormatSetting(this.containerEl);
    this.createNoteTemplateSetting(this.containerEl);
  }

  /**
   * Clears invalid styling from an input element.
   * @param inputEl - The input element to clear
   */
  private clearInputInvalid(inputEl: HTMLInputElement): void {
    inputEl.removeClass(CSS_CLASSES.INVALID);
    inputEl.style.removeProperty("border-color");
  }

  /**
   * Creates the API credentials help text and link.
   * Only shown when credentials are missing.
   * @param containerEl - The container element to add the help text to
   */
  private createApiCredentialsHelp(containerEl: HTMLElement): void {
    if (
      this.plugin.settings.spotifyClientId &&
      this.plugin.settings.spotifyClientSecret
    ) {
      return;
    }

    const setting = new Setting(containerEl).setDesc(
      createFragment((el) => {
        el.appendText("To use this plugin, you need Spotify API credentials. ");
        el.createEl("a", {
          attr: { target: "_blank" },
          href: SPOTIFY_API_DOCS_URL,
          text: "Learn how to get Spotify API credentials",
        });
      }),
    );

    this.credentialsHelpEl = setting.settingEl;
  }

  /**
   * Creates the date format setting with moment.js format preview.
   * @param containerEl - The container element to add the setting to
   */
  private createDateFormatSetting(containerEl: HTMLElement): void {
    const setting = new Setting(containerEl).setName("Date Format");

    setting.descEl.appendChild(
      createFragment((el: DocumentFragment) => {
        el.appendText("For more syntax, refer to ");
        el.createEl("a", {
          attr: { target: "_blank" },
          href: MOMENT_FORMAT_DOCS_URL,
          text: "format reference",
        });
        el.createEl("br");
        el.appendText("Your current syntax looks like this: ");
        setting.addMomentFormat((format) => {
          format
            .setDefaultFormat(DEFAULT_SETTINGS.dateFormat)
            .setValue(this.plugin.settings.dateFormat)
            .setSampleEl(el.createSpan({ cls: CSS_CLASSES.U_POP }))
            .onChange(async (value) => {
              this.plugin.settings.dateFormat = value || "YYYY-MM-DD";
              await this.plugin.saveSettings();
            });
        });
      }),
    );
  }

  /**
   * Creates an error message element.
   * @param parent - The parent element to append the error to
   * @param message - The error message text
   * @returns The created error element
   */
  private createErrorElement(
    parent: HTMLElement,
    message: string,
  ): HTMLElement {
    const errorEl = parent.createDiv();
    errorEl.style.color = CSS_VARIABLES.TEXT_ERROR;
    errorEl.style.fontSize = CSS_VARIABLES.FONT_UI_SMALLER;
    errorEl.setText(message);
    return errorEl;
  }

  /**
   * Creates the note name format setting with dropdown options.
   * @param containerEl - The container element to add the setting to
   */
  private createNoteNameFormatSetting(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName("Note Name Format")
      .setDesc("How to format the note file name")
      .addDropdown((dropdown) => {
        for (const format of Object.values(NOTE_NAME_FORMAT)) {
          dropdown.addOption(format, getNoteNameFormatLabel(format));
        }

        dropdown
          .setValue(this.plugin.settings.noteNameFormat)
          .onChange(async (value) => {
            this.plugin.settings.noteNameFormat =
              value as (typeof NOTE_NAME_FORMAT)[keyof typeof NOTE_NAME_FORMAT];
            await this.plugin.saveSettings();
          });
      });
  }

  /**
   * Creates the note template setting with textarea input.
   * @param containerEl - The container element to add the setting to
   */
  private createNoteTemplateSetting(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName("Note Template")
      .setDesc(createFragment(createTemplateVariablesFragment))
      .addTextArea((text) => {
        text
          .setPlaceholder("# {{title}}\n\n")
          .setValue(this.plugin.settings.noteTemplate)
          .onChange(async (value) => {
            this.plugin.settings.noteTemplate = value;
            await this.plugin.saveSettings();
          });
        text.inputEl.rows = 8;

        new TemplateSuggest(this.app, text.inputEl);
      });
  }

  /**
   * Creates the output folder setting with folder picker.
   * @param containerEl - The container element to add the setting to
   */
  private createOutputFolderSetting(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName("Output Folder")
      .setDesc("Where to create song notes (relative to vault root)")
      .addText((text) => {
        text
          .setPlaceholder("Music/Song of the Day")
          .setValue(this.plugin.settings.outputFolder)
          .onChange(async (value) => {
            this.plugin.settings.outputFolder = value.trim();
            await this.plugin.saveSettings();
          });

        new FolderSuggest(this.app, text.inputEl);
      });
  }

  /**
   * Creates the Spotify Client ID setting with validation.
   * @param containerEl - The container element to add the setting to
   */
  private createSpotifyClientIdSetting(containerEl: HTMLElement): void {
    const setting = new Setting(containerEl)
      .setName("Spotify Client ID")
      .setDesc("Your Spotify application client ID");

    let errorEl: HTMLElement | null = null;

    setting.addText((text) => {
      text
        .setPlaceholder("Enter client ID")
        .setValue(this.plugin.settings.spotifyClientId)
        .onChange(async (value) => {
          const trimmedValue = value.trim();

          this.plugin.settings.spotifyClientId = trimmedValue;
          await this.plugin.saveSettings();

          if (trimmedValue.length === 0) {
            this.markInputInvalid(text.inputEl);
            if (!errorEl) {
              errorEl = this.createErrorElement(
                setting.infoEl,
                "Client ID is required to use this plugin",
              );
            }
            return;
          }

          this.clearInputInvalid(text.inputEl);
          errorEl?.remove();
          errorEl = null;

          if (
            this.plugin.settings.spotifyClientId &&
            this.plugin.settings.spotifyClientSecret &&
            this.credentialsHelpEl
          ) {
            this.credentialsHelpEl.remove();
            this.credentialsHelpEl = null;
          }
        });

      if (!this.plugin.settings.spotifyClientId) {
        this.markInputInvalid(text.inputEl);
        errorEl = this.createErrorElement(
          setting.infoEl,
          "Client ID is required to use this plugin",
        );
      }
    });
  }

  /**
   * Creates the Spotify Client Secret setting with validation.
   * @param containerEl - The container element to add the setting to
   */
  private createSpotifyClientSecretSetting(containerEl: HTMLElement): void {
    const setting = new Setting(containerEl)
      .setName("Spotify Client Secret")
      .setDesc("Your Spotify application client secret");

    let errorEl: HTMLElement | null = null;

    setting.addText((text) => {
      text
        .setPlaceholder("Enter client secret")
        .setValue(this.plugin.settings.spotifyClientSecret)
        .onChange(async (value) => {
          const trimmedValue = value.trim();

          this.plugin.settings.spotifyClientSecret = trimmedValue;
          await this.plugin.saveSettings();

          if (trimmedValue.length === 0) {
            this.markInputInvalid(text.inputEl);
            if (!errorEl) {
              errorEl = this.createErrorElement(
                setting.infoEl,
                "Client Secret is required to use this plugin",
              );
            }
            return;
          }

          this.clearInputInvalid(text.inputEl);
          errorEl?.remove();
          errorEl = null;

          if (
            this.plugin.settings.spotifyClientId &&
            this.plugin.settings.spotifyClientSecret &&
            this.credentialsHelpEl
          ) {
            this.credentialsHelpEl.remove();
            this.credentialsHelpEl = null;
          }
        });

      text.inputEl.type = "password";

      if (!this.plugin.settings.spotifyClientSecret) {
        this.markInputInvalid(text.inputEl);
        errorEl = this.createErrorElement(
          setting.infoEl,
          "Client Secret is required to use this plugin",
        );
      }
    });
  }

  /**
   * Marks an input as invalid with error styling.
   * @param inputEl - The input element to mark as invalid
   */
  private markInputInvalid(inputEl: HTMLInputElement): void {
    inputEl.addClass(CSS_CLASSES.INVALID);
    inputEl.style.borderColor = CSS_VARIABLES.TEXT_ERROR;
  }
}
