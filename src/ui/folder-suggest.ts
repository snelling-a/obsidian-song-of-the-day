import { AbstractInputSuggest, TFolder } from "obsidian";

/**
 * Provides folder suggestions for text input fields using case-insensitive substring search.
 * Searches through all folders in the vault and displays matching results.
 */
export class FolderSuggest extends AbstractInputSuggest<TFolder> {
  /** @inheritdoc */
  public renderSuggestion(folder: TFolder, el: HTMLElement): void {
    el.setText(folder.path);
  }

  /** @inheritdoc */
  public selectSuggestion(folder: TFolder): void {
    this.setValue(folder.path);
    this.close();
  }

  /** @inheritdoc */
  protected getSuggestions(query: string): TFolder[] {
    const folders: TFolder[] = [];
    const lowerQuery = query.toLowerCase();

    this.app.vault.getAllFolders().forEach((folder: TFolder) => {
      if (folder.path.toLowerCase().includes(lowerQuery)) {
        folders.push(folder);
      }
    });

    return folders;
  }
}
