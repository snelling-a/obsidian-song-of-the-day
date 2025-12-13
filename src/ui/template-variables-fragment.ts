import { TEMPLATE_VARIABLES } from "src/constants/template-variables";
import { CSS_VARIABLES } from "src/ui/css";

/**
 * Creates a DocumentFragment with formatted template variable documentation.
 * Each variable is displayed as code with its description, aligned in columns.
 * @param el The DocumentFragment to populate
 */
export function createTemplateVariablesFragment(el: DocumentFragment): void {
  el.appendText("Template for note body. Available variables:");

  const variablesContainer = el.createDiv();
  variablesContainer.setCssProps({ "margin-top": CSS_VARIABLES.SIZE_4_2 });

  for (const variable of TEMPLATE_VARIABLES) {
    const row = variablesContainer.createDiv();
    row.setCssProps({
      "align-items": "baseline",
      display: "flex",
      gap: CSS_VARIABLES.SIZE_4_2,
    });

    const code = row.createEl("code", { text: `{{${variable.name}}}` });
    code.setCssProps({
      display: "inline-block",
      "min-width": "130px",
    });

    row.appendText(variable.description);
  }
}
