import SongOfTheDayPlugin from "main";
import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import { FIELD_REGISTRY } from "src/constants/field-registry";
import { SpotifyService } from "src/services/spotify";
import { clearCachedService } from "src/services/spotify/spotify-manager";
import { CSS_CLASSES, CSS_VARIABLES } from "src/ui/css";
import { FolderSuggest } from "src/ui/folder-suggest";
import { OAuthCallbackModal } from "src/ui/oauth-callback-modal";
import { TemplateSuggest } from "src/ui/template-suggest";
import {
  getNoteNameCasingLabel,
  getNoteNameStructureLabel,
} from "src/utils/format";

import {
  DEFAULT_SETTINGS,
  MOMENT_FORMAT_DOCS_URL,
  NOTE_NAME_CASING,
  NOTE_NAME_STRUCTURE,
  SPOTIFY_API_DOCS_URL,
} from "./constants";
import { createTemplateVariablesFragment } from "./utils";

/** Settings tab for the Song of the Day plugin. */
export class SongOfTheDaySettingTab extends PluginSettingTab {
  public readonly plugin: SongOfTheDayPlugin;
  private codeVerifier: null | string = null;
  private credentialsHelpEl: HTMLElement | null = null;
  private oauthState: null | string = null;

  /**
   * Creates the settings tab for the plugin.
   * @param app The Obsidian application instance
   * @param plugin The plugin instance
   */
  constructor(app: App, plugin: SongOfTheDayPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  /** @inheritdoc */
  public display(): void {
    this.containerEl.empty();
    new Setting(this.containerEl).setHeading().setName("API credentials");
    this.createApiCredentialsHelp(this.containerEl);
    this.createSpotifyClientIdSetting(this.containerEl);
    this.createSpotifyClientSecretSetting(this.containerEl);
    new Setting(this.containerEl).setHeading().setName("Playlist settings");
    this.createAuthenticationStatus(this.containerEl);
    this.createAuthenticationButton(this.containerEl);
    this.createPlaylistIdSetting(this.containerEl);
    new Setting(this.containerEl).setHeading().setName("Note settings");
    this.createOutputFolderSetting(this.containerEl);
    this.createNoteNameStructureSetting(this.containerEl);
    this.createNoteNameCasingSetting(this.containerEl);
    this.createDateFormatSetting(this.containerEl);
    this.createNoteTemplateSetting(this.containerEl);
    new Setting(this.containerEl).setHeading().setName("Frontmatter fields");
    this.createFrontmatterFieldsSettings(this.containerEl);
  }

  /**
   * Clears invalid styling from an input element.
   * @param inputEl The input element to clear
   */
  private clearInputInvalid(inputEl: HTMLInputElement): void {
    inputEl.removeClass(CSS_CLASSES.INVALID);
    inputEl.style.removeProperty("border-color");
  }

  /**
   * Creates the API credentials help text and link.
   * Only shown when credentials are missing.
   * @param containerEl The container element to add the help text to
   */
  private createApiCredentialsHelp(containerEl: HTMLElement): void {
    if (
      this.plugin.settings.spotifyClientId
      && this.plugin.settings.spotifyClientSecret
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
   * Creates the Spotify authentication button.
   * @param containerEl The container element to add the button to
   */
  private createAuthenticationButton(containerEl: HTMLElement): void {
    const service = this.plugin.getSpotifyService();
    const isAuthenticated = service?.isUserAuthenticated() ?? false;

    new Setting(containerEl)
      .setName("Spotify authentication")
      .setDesc(
        isAuthenticated
          ? "Re-authenticate to refresh connection"
          : "Authenticate with Spotify to enable playlist features",
      )
      .addButton((button) => {
        button
          .setButtonText(isAuthenticated ? "Re-authenticate" : "Authenticate")
          .onClick(async () => {
            await this.handleAuthentication();
          });
      });
  }

  /**
   * Creates the authentication status display.
   * @param containerEl The container element to add the status to
   */
  private createAuthenticationStatus(containerEl: HTMLElement): void {
    const service = this.plugin.getSpotifyService();
    const isAuthenticated = service?.isUserAuthenticated() ?? false;

    const setting = new Setting(containerEl)
      .setName("Connection status")
      .setDesc(
        isAuthenticated
          ? "Connected to Spotify"
          : "Not connected. Authenticate below to add songs to playlists.",
      );

    if (isAuthenticated) {
      setting.descEl.setCssProps({
        color: CSS_VARIABLES.TEXT_SUCCESS,
      });
    }
  }

  /**
   * Creates the date format setting with moment.js format preview.
   * @param containerEl The container element to add the setting to
   */
  private createDateFormatSetting(containerEl: HTMLElement): void {
    const setting = new Setting(containerEl).setName("Date format");

    setting.descEl.appendChild(
      createFragment((el) => {
        el.appendText("For more syntax, refer to ");
        el.createEl("a", {
          attr: { target: "_blank" },
          href: MOMENT_FORMAT_DOCS_URL,
          // eslint-disable-next-line obsidianmd/ui/sentence-case -- Link text in mid-sentence should not be capitalized
          text: "format reference",
        });
        el.createEl("br");
        el.appendText("Your current syntax looks like this: ");
        setting.addMomentFormat((component) => {
          component
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
   * @param parent The parent element to append the error to
   * @param message The error message text
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
   * Creates toggle settings for frontmatter fields.
   * @param containerEl The container element to add the settings to
   */
  private createFrontmatterFieldsSettings(containerEl: HTMLElement): void {
    const setting = new Setting(containerEl)
      .setName("Include fields")
      .setDesc("Select which fields to include in note frontmatter");

    const toggleContainer = setting.settingEl.createDiv();
    toggleContainer.setCssProps({
      display: "grid",
      gap: CSS_VARIABLES.SIZE_4_2,
      "grid-template-columns": "repeat(auto-fill, minmax(12ch, 1fr))",
      "margin-top": CSS_VARIABLES.SIZE_4_2,
    });

    for (const field of FIELD_REGISTRY) {
      const fieldEl = toggleContainer.createDiv();
      fieldEl.setCssProps({
        "align-items": "center",
        display: "flex",
        gap: CSS_VARIABLES.SIZE_4_2,
      });

      const toggle = fieldEl.createEl("input", {
        type: "checkbox",
      });
      toggle.checked = this.plugin.settings.frontmatterFields[field.key];
      toggle.addEventListener("change", () => {
        this.plugin.settings.frontmatterFields[field.key] = toggle.checked;
        void this.plugin.saveSettings();
      });

      const labelEl = fieldEl.createEl("label", {
        text: field.label,
      });
      labelEl.setCssProps({
        cursor: "pointer",
      });
      labelEl.addEventListener("click", () => {
        toggle.checked = !toggle.checked;
        toggle.dispatchEvent(new Event("change"));
      });
    }
  }

  /**
   * Creates the note name casing setting with dropdown options.
   * @param containerEl The container element to add the setting to
   */
  private createNoteNameCasingSetting(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName("Note name casing")
      .setDesc("How to format the casing of the note file name")
      .addDropdown((container) => {
        for (const casing of Object.values(NOTE_NAME_CASING)) {
          container.addOption(casing, getNoteNameCasingLabel(casing));
        }

        container
          .setValue(this.plugin.settings.noteNameCasing)
          .onChange(async (value) => {
            this.plugin.settings.noteNameCasing
              = value as (typeof NOTE_NAME_CASING)[keyof typeof NOTE_NAME_CASING];
            await this.plugin.saveSettings();
          });
      });
  }

  /**
   * Creates the note name structure setting with dropdown options.
   * @param containerEl The container element to add the setting to
   */
  private createNoteNameStructureSetting(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName("Note name structure")
      .setDesc("What information to include in the note file name")
      .addDropdown((dropdown) => {
        for (const structure of Object.values(NOTE_NAME_STRUCTURE)) {
          dropdown.addOption(structure, getNoteNameStructureLabel(structure));
        }

        dropdown
          .setValue(this.plugin.settings.noteNameStructure)
          .onChange(async (value) => {
            this.plugin.settings.noteNameStructure
              = value as (typeof NOTE_NAME_STRUCTURE)[keyof typeof NOTE_NAME_STRUCTURE];
            await this.plugin.saveSettings();
          });
      });
  }

  /**
   * Creates the note template setting with textarea input.
   * @param containerEl The container element to add the setting to
   */
  private createNoteTemplateSetting(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName("Note template")
      .setDesc(createFragment(createTemplateVariablesFragment))
      .addTextArea((component) => {
        component
          .setPlaceholder("# {{title}}\n\n")
          .setValue(this.plugin.settings.noteTemplate)
          .onChange(async (value) => {
            this.plugin.settings.noteTemplate = value;
            await this.plugin.saveSettings();
          });
        component.inputEl.rows = 8;

        new TemplateSuggest(this.app, component.inputEl);
      });
  }

  /**
   * Creates the output folder setting with folder picker.
   * @param containerEl The container element to add the setting to
   */
  private createOutputFolderSetting(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName("Output folder")
      .setDesc("Where to create song notes (relative to vault root)")
      .addText((component) => {
        component
          // eslint-disable-next-line obsidianmd/ui/sentence-case -- Example folder path includes plugin name capitalization
          .setPlaceholder("Music/Song of the Day")
          .setValue(this.plugin.settings.outputFolder)
          .onChange(async (value) => {
            this.plugin.settings.outputFolder = value.trim();
            await this.plugin.saveSettings();
          });

        new FolderSuggest(this.app, component.inputEl);
      });
  }

  /**
   * Creates the playlist ID setting.
   * @param containerEl The container element to add the setting to
   */
  private createPlaylistIdSetting(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName("Playlist ID")
      .setDesc("The Spotify playlist ID or URL where songs will be added")
      .addText((text) => {
        text

          .setPlaceholder(
            // eslint-disable-next-line obsidianmd/ui/sentence-case -- Spotify URI format requires lowercase 'spotify:' prefix
            "spotify:playlist:37i9dQZF1DXcBWIGoYBM5M or playlist URL",
          )
          .setValue(this.plugin.settings.playlistId)
          .onChange(async (value) => {
            const trimmedValue = value.trim();
            let playlistId = trimmedValue;

            if (trimmedValue.includes("spotify.com/playlist/")) {
              const match = /spotify\.com\/playlist\/([a-zA-Z0-9]+)/.exec(
                trimmedValue,
              );
              if (match) {
                playlistId = match[1];
              }
            }
            else if (trimmedValue.startsWith("spotify:playlist:")) {
              playlistId = trimmedValue.replace("spotify:playlist:", "");
            }

            this.plugin.settings.playlistId = playlistId;
            await this.plugin.saveSettings();
          });
        text.inputEl.setCssProps({
          width: "100%",
        });
      });
  }

  /**
   * Creates the Spotify Client ID setting with validation.
   * @param containerEl The container element to add the setting to
   */
  private createSpotifyClientIdSetting(containerEl: HTMLElement): void {
    const setting = new Setting(containerEl)
      .setName("Spotify client ID")
      .setDesc("Your Spotify application client ID");

    let errorEl: HTMLElement | null = null;

    setting.addText((component) => {
      component
        .setPlaceholder("Enter client ID")
        .setValue(this.plugin.settings.spotifyClientId)
        .onChange(async (value) => {
          const trimmedValue = value.trim();

          this.plugin.settings.spotifyClientId = trimmedValue;
          await this.plugin.saveSettings();

          if (trimmedValue.length === 0) {
            this.markInputInvalid(component.inputEl);
            errorEl ??= this.createErrorElement(
              setting.infoEl,
              "Client ID is required to use this plugin",
            );

            return;
          }

          this.clearInputInvalid(component.inputEl);
          errorEl?.remove();
          errorEl = null;

          if (
            this.plugin.settings.spotifyClientId
            && this.plugin.settings.spotifyClientSecret
            && this.credentialsHelpEl
          ) {
            this.credentialsHelpEl.remove();
            this.credentialsHelpEl = null;
          }
        });

      if (!this.plugin.settings.spotifyClientId) {
        this.markInputInvalid(component.inputEl);
        errorEl = this.createErrorElement(
          setting.infoEl,
          "Client ID is required to use this plugin",
        );
      }
    });
  }

  /**
   * Creates the Spotify Client Secret setting with validation.
   * @param containerEl The container element to add the setting to
   */
  private createSpotifyClientSecretSetting(containerEl: HTMLElement): void {
    const setting = new Setting(containerEl)
      .setName("Spotify client secret")
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
            errorEl ??= this.createErrorElement(
              setting.infoEl,
              "Client Secret is required to use this plugin",
            );

            return;
          }

          this.clearInputInvalid(text.inputEl);
          errorEl?.remove();
          errorEl = null;

          if (
            this.plugin.settings.spotifyClientId
            && this.plugin.settings.spotifyClientSecret
            && this.credentialsHelpEl
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
   * Handles the OAuth authentication flow.
   * @todo use Web Viewer API if available in Obsidian
   */
  private async handleAuthentication(): Promise<void> {
    if (!this.plugin.settings.spotifyClientId) {
      // eslint-disable-next-line obsidianmd/ui/sentence-case -- 'Client ID' is Spotify's official terminology from their API documentation
      new Notice("Please configure Spotify Client ID first");

      return;
    }

    try {
      const { codeVerifier, state, url } = await SpotifyService.generateAuthUrl(
        this.plugin.settings.spotifyClientId,
      );

      this.codeVerifier = codeVerifier;
      this.oauthState = state;

      window.open(url, "_blank");

      new OAuthCallbackModal(this.app, (callbackUrl) => {
        void this.handleOAuthCallback(callbackUrl);
      }).open();
    }
    catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Authentication error:", error);
      new Notice(`Authentication failed: ${message}`);
    }
  }

  /**
   * Handles the OAuth callback URL.
   * @param callbackUrl The callback URL from Spotify
   */
  private async handleOAuthCallback(callbackUrl: string): Promise<void> {
    if (!this.codeVerifier || !this.oauthState) {
      new Notice("Authentication session expired. Please try again.");

      return;
    }

    try {
      const url = new URL(callbackUrl);
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");

      if (!code) {
        new Notice("No authorization code found in URL");

        return;
      }

      if (state !== this.oauthState) {
        new Notice(
          "Invalid authentication state. Possible security issue. Please try again.",
        );

        return;
      }

      const tokens = await SpotifyService.exchangeCodeForTokens(
        this.plugin.settings.spotifyClientId,
        code,
        this.codeVerifier,
      );

      this.plugin.settings.spotifyAccessToken = tokens.accessToken;
      this.plugin.settings.spotifyRefreshToken = tokens.refreshToken;
      this.plugin.settings.spotifyTokenExpiry
        = Date.now() + tokens.expiresIn * 1000;

      await this.plugin.saveSettings();
      clearCachedService();

      new Notice("Successfully authenticated with Spotify!");

      this.display();
    }
    catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      new Notice(`Failed to complete authentication: ${message}`);
    }
    finally {
      this.codeVerifier = null;
      this.oauthState = null;
    }
  }

  /**
   * Marks an input as invalid with error styling.
   * @param inputEl The input element to mark as invalid
   */
  private markInputInvalid(inputEl: HTMLInputElement): void {
    inputEl.addClass(CSS_CLASSES.INVALID);
    inputEl.style.borderColor = CSS_VARIABLES.BACKGROUND_MODIFIER_ERROR;
  }
}
