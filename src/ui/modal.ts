import { App, displayTooltip, Modal, Setting } from "obsidian";

import { CSS_CLASSES } from "../constants/css";

/**
 * Modal dialog for inputting Spotify track links.
 * Accepts URLs, URIs, or raw track IDs and validates input before submission.
 */
export class SpotifyInputModal extends Modal {
  private inputEl: HTMLInputElement | null = null;
  private onSubmit: (result: string) => Promise<void> | void;
  private result = "";

  /**
   * Creates a modal for inputting Spotify track links
   * @param app - Obsidian app instance
   * @param onSubmit - Callback to execute when user submits input
   */
  constructor(app: App, onSubmit: (result: string) => Promise<void> | void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  /**
   * @inheritDoc
   */
  onClose() {
    const { contentEl } = this;

    contentEl.empty();
  }

  /**
   * @inheritDoc
   */
  onOpen() {
    const { contentEl } = this;

    contentEl.createEl("h2", { text: "Create Song of the Day Note" });

    new Setting(contentEl)
      .setName("Spotify Link or ID")
      .setDesc("Paste a Spotify track URL, URI, or track ID")
      .addText((text) => {
        this.inputEl = text.inputEl;
        text
          .setPlaceholder("https://open.spotify.com/track/...")
          .onChange((value) => {
            this.result = value;
          });
        text.inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void this.submit();
          }
        });
        setTimeout(() => {
          text.inputEl.focus();
        }, 10);
      });

    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText("Create")
          .setCta()
          .onClick(() => {
            void this.submit();
          }),
      )
      .addButton((btn) =>
        btn.setButtonText("Cancel").onClick(() => {
          this.close();
        }),
      );
  }

  /**
   * Shows error tooltip below the input using Obsidian's displayTooltip API
   * @param message - Error message to display
   */
  private showError(message: string): void {
    if (!this.inputEl) return;

    this.inputEl.blur();

    displayTooltip(this.inputEl, message, {
      classes: [CSS_CLASSES.MOD_ERROR],
      placement: "bottom",
    });
  }

  /**
   * Handles form submission and triggers the callback with user input
   */
  private async submit() {
    if (!this.result.trim()) {
      this.showError("Please enter a Spotify link or track ID");

      return;
    }

    try {
      await this.onSubmit(this.result.trim());
      this.close();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An error occurred";

      this.showError(message);
      console.error("Error in onSubmit:", error);
    }
  }
}
