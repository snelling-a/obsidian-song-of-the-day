import { App, Modal, Notice, Setting } from "obsidian";
import { REDIRECT_URI } from "src/services/spotify/constants";

/**
 * Modal for capturing OAuth callback URL from user.
 */
export class OAuthCallbackModal extends Modal {
  private callbackUrl = "";
  private onSubmit: (callbackUrl: string) => void;

  /**
   * Creates a new OAuth callback modal.
   * @param app The Obsidian app instance
   * @param onSubmit Callback function to handle the URL submission
   */
  constructor(app: App, onSubmit: (callbackUrl: string) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  /** @inheritdoc */
  public onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }

  /** @inheritdoc */
  public onOpen(): void {
    const { contentEl } = this;

    contentEl.createEl("h2", { text: "Spotify authorization" });

    contentEl.createEl("p", {
      text: "After authorizing with Spotify, you will be redirected to a page. Copy the entire URL from your browser and paste it below.",
    });

    new Setting(contentEl)
      .setName("Callback URL")
      .setDesc("Paste the full URL from your browser after authorization.")
      .addText((component) => {
        component
          .setPlaceholder(REDIRECT_URI)
          .setValue(this.callbackUrl)
          .onChange((value) => {
            this.callbackUrl = value.trim();
          });
        component.inputEl.setCssProps({
          width: "100%",
        });

        setTimeout(() => {
          component.inputEl.focus();
        }, 100);
      });

    new Setting(contentEl)
      .addButton((component) => {
        component.setButtonText("Cancel").onClick(() => {
          this.close();
        });
      })
      .addButton((component) => {
        component
          .setButtonText("Submit")
          .setCta()
          .onClick(() => {
            if (!this.callbackUrl) {
              new Notice("Please enter the callback URL");

              return;
            }

            this.onSubmit(this.callbackUrl);
            this.close();
          });
      });
  }
}
