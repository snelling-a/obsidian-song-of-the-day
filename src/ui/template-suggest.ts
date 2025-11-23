import { AbstractInputSuggest, App } from "obsidian";

import {
  TEMPLATE_VARIABLES,
  type TemplateVariable,
} from "../constants/template-variables";

/**
 * Provides template variable suggestions for textarea fields.
 * Triggers when user types "{{" and suggests available template variables.
 *
 * Note: AbstractInputSuggest officially only accepts HTMLInputElement | HTMLDivElement,
 * but it works correctly with HTMLTextAreaElement at runtime since textareas share
 * the same interface (value, selectionStart, addEventListener, etc.) that
 * AbstractInputSuggest requires.
 */
export class TemplateSuggest extends AbstractInputSuggest<TemplateVariable> {
  private textareaEl: HTMLTextAreaElement;
  private triggerStart = -1;

  /** @inheritdoc */
  constructor(app: App, textareaEl: HTMLTextAreaElement) {
    // @ts-expect-error - AbstractInputSuggest types don't include HTMLTextAreaElement,
    // but textareas have all required properties (value, selectionStart, etc.)
    // and work correctly at runtime
    super(app, textareaEl);
    this.textareaEl = textareaEl;
  }

  /** @inheritdoc */
  public renderSuggestion(variable: TemplateVariable, el: HTMLElement): void {
    el.createDiv({ cls: "suggestion-title", text: `{{${variable.name}}}` });
    el.createDiv({ cls: "suggestion-note", text: variable.description });
  }

  /** @inheritdoc */
  public selectSuggestion(variable: TemplateVariable): void {
    if (this.triggerStart === -1) {
      return;
    }

    const cursorPos = this.textareaEl.selectionStart;
    const textBefore = this.textareaEl.value.substring(0, this.triggerStart);
    const textAfter = this.textareaEl.value.substring(cursorPos);
    const replacement = `{{${variable.name}}}`;

    this.textareaEl.value = textBefore + replacement + textAfter;

    const newCursorPos = this.triggerStart + replacement.length;
    this.textareaEl.setSelectionRange(newCursorPos, newCursorPos);
    this.textareaEl.dispatchEvent(new Event("input", { bubbles: true }));

    this.close();
  }

  /** @inheritdoc */
  protected getSuggestions(): TemplateVariable[] {
    const cursorPos = this.textareaEl.selectionStart;
    const textBeforeCursor = this.textareaEl.value.substring(0, cursorPos);
    const lastDoubleBrace = textBeforeCursor.lastIndexOf("{{");

    if (lastDoubleBrace === -1) {
      this.triggerStart = -1;

      return [];
    }

    this.triggerStart = lastDoubleBrace;
    const searchQuery = textBeforeCursor
      .substring(lastDoubleBrace + 2)
      .toLowerCase();

    return TEMPLATE_VARIABLES.filter((variable) => {
      return (
        variable.name.toLowerCase().includes(searchQuery)
        || variable.description.toLowerCase().includes(searchQuery)
      );
    });
  }
}
