import { AbstractInputSuggest, TFolder } from "obsidian";

/**
 * Provides folder suggestions for text input fields using case-insensitive substring search.
 * Searches through all folders in the vault and displays matching results.
 */
export class FolderSuggest extends AbstractInputSuggest<TFolder> {
  /**
   * Renders each folder suggestion in the dropdown.
   * @param folder - The folder to render
   * @param el - The HTML element to render into
   */
  renderSuggestion(folder: TFolder, el: HTMLElement): void {
    el.setText(folder.path);
  }

  /**
   * Handles when user selects a folder suggestion.
   * @param folder - The selected folder
   */
  selectSuggestion(folder: TFolder): void {
    this.setValue(folder.path);
    this.close();
  }

  /**
   * Returns all folders in the vault that match the query.
   * @param query - The search string to filter folders by
   * @returns Array of matching folders
   */
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
