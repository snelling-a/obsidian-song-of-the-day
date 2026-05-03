import { TEMPLATE_VARIABLES } from "src/constants/template-variables";

/**
 * Creates a DocumentFragment with formatted template variable documentation.
 * Each variable is displayed as code with its description, aligned in columns.
 * @param el The DocumentFragment to populate
 */
export function createTemplateVariablesFragment(el: DocumentFragment): void {
  el.appendText("Template for note body. Available variables:");

  const variablesContainer = el.createDiv({
    cls: "song-of-the-day-setting-template-vars",
  });

  for (const variable of TEMPLATE_VARIABLES) {
    const row = variablesContainer.createDiv({
      cls: "song-of-the-day-setting-template-var-row",
    });

    row.createEl("code", {
      cls: "song-of-the-day-setting-template-var-code",
      text: `{{${variable.name}}}`,
    });

    row.appendText(variable.description);
  }
}
