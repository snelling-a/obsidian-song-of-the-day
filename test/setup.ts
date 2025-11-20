/**
 * Test setup file for Vitest
 * Polyfills Obsidian-specific DOM extensions for testing
 */

// Add setCssProps to HTMLElement prototype
if (!HTMLElement.prototype.setCssProps) {
  HTMLElement.prototype.setCssProps = function (
    props: Record<string, string>,
  ): void {
    for (const [key, value] of Object.entries(props)) {
      if (value === "") {
        this.style.removeProperty(key);
      } else {
        this.style.setProperty(key, value);
      }
    }
  };
}

declare global {
  interface HTMLElement {
    setCssProps(props: Record<string, string>): void;
  }
}

export {};
