import { TEMPLATE_VARIABLES } from "src/constants/template-variables";

/**
 * Creates a DocumentFragment with formatted template variable documentation.
 * Each variable is displayed as code with its description, aligned in columns.
 * @param el The DocumentFragment to populate
 */
export function createTemplateVariablesFragment(el: DocumentFragment): void {
  el.appendText("Template for note body. Available variables:");

  const variablesContainer = el.createDiv();
  variablesContainer.addClass("song-of-the-day-variables-container");

  for (const variable of TEMPLATE_VARIABLES) {
    const row = variablesContainer.createDiv();
    row.addClass("song-of-the-day-variable-row");

    const code = row.createEl("code", { text: `{{${variable.name}}}` });
    code.addClass("song-of-the-day-variable-code");

    row.appendText(variable.description);
  }
}
