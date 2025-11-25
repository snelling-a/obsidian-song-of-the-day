import { App, displayTooltip, Modal, Setting } from "obsidian";

import { CSS_CLASSES } from "./css";

/**
 * Modal dialog for inputting Spotify track links or IDs.
 */
export class SpotifyInputModal extends Modal {
  private inputEl: HTMLInputElement | null = null;
  private onSubmit: (result: string) => void;
  private result = "";

  /**
   * Creates a modal for inputting Spotify track links.
   * @param app Obsidian app instance
   * @param onSubmit Callback to execute when user submits input
   */
  constructor(app: App, onSubmit: (result: string) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  /**
   * @inheritdoc
   */
  public onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }

  /**
   * @inheritdoc
   */
  public onOpen(): void {
    const { contentEl } = this;

    contentEl.createEl("h2", { text: "Create song note" });

    new Setting(contentEl)
      .setName("Spotify link or ID")
      .setDesc("Paste a Spotify track URL, URI, or track ID.")
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
            this.submit();
          }
        });
        setTimeout(() => {
          text.inputEl.focus();
        }, 10);
      });

    new Setting(contentEl)
      .addButton(btn =>
        btn
          .setButtonText("Create")
          .setCta()
          .onClick(() => {
            this.submit();
          }),
      )
      .addButton(btn =>
        btn.setButtonText("Cancel").onClick(() => {
          this.close();
        }),
      );
  }

  /**
   * Shows error tooltip below the input using Obsidian's displayTooltip API.
   * @param message Error message to display
   */
  private showError(message: string): void {
    if (!this.inputEl) {
      return;
    }

    this.inputEl.blur();

    displayTooltip(this.inputEl, message, {
      classes: [CSS_CLASSES.MOD_ERROR],
      placement: "bottom",
    });
  }

  /**
   * Handles form submission and triggers the callback with user input.
   */
  private submit(): void {
    if (!this.result.trim()) {
      this.showError("Please enter a Spotify link or track ID");

      return;
    }

    try {
      this.onSubmit(this.result.trim());
      this.close();
    }
    catch (error) {
      const message
        = error instanceof Error ? error.message : "An error occurred";
      this.showError(message);
      console.error("Error in onSubmit:", error);
    }
  }
}
