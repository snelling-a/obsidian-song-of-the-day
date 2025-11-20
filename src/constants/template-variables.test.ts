import { Track } from "src/types/spotify";
import { exampleTitle } from "src/utils/format";
import {
  createMockDocumentFragment,
  createMockPlugin,
} from "test/fixtures/obsidian";
import { mockTrackResponse } from "test/fixtures/spotify";
import { beforeEach, describe, expect, it } from "vitest";

import {
  createTemplateVariablesFragment,
  TEMPLATE_VARIABLES,
} from "./template-variables";

// eslint-disable-next-line vitest/prefer-lowercase-title
describe("TEMPLATE_VARIABLES", () => {
  const mockPlugin = createMockPlugin();

  it("should extract title", () => {
    const variable = TEMPLATE_VARIABLES.find((v) => v.name === "title");

    expect(variable).toBeDefined();
    expect(variable?.getValue(mockTrackResponse, mockPlugin)).toBe(
      exampleTitle,
    );
  });

  it("should extract artist", () => {
    const variable = TEMPLATE_VARIABLES.find((v) => v.name === "artist");

    expect(variable).toBeDefined();
    expect(variable?.getValue(mockTrackResponse, mockPlugin)).toBe(
      "Test Artist",
    );
  });

  it("should extract album", () => {
    const variable = TEMPLATE_VARIABLES.find((v) => v.name === "album");

    expect(variable).toBeDefined();
    expect(variable?.getValue(mockTrackResponse, mockPlugin)).toBe(
      "Test Album",
    );
  });

  it("should extract release_date", () => {
    const variable = TEMPLATE_VARIABLES.find((v) => v.name === "release_date");

    expect(variable).toBeDefined();
    expect(variable?.getValue(mockTrackResponse, mockPlugin)).toBe(
      "2024-01-01",
    );
  });

  it("should extract spotify_url", () => {
    const variable = TEMPLATE_VARIABLES.find((v) => v.name === "spotify_url");

    expect(variable).toBeDefined();
    expect(variable?.getValue(mockTrackResponse, mockPlugin)).toBe(
      "https://open.spotify.com/track/789",
    );
  });

  it("should handle multiple artists", () => {
    const trackWithMultipleArtists = {
      ...mockTrackResponse,
      artists: [
        { name: "Artist 1" },
        { name: "Artist 2" },
        { name: "Artist 3" },
      ],
    } as Track;

    const variable = TEMPLATE_VARIABLES.find((v) => v.name === "artist");

    expect(variable?.getValue(trackWithMultipleArtists, mockPlugin)).toBe(
      "Artist 1, Artist 2, Artist 3",
    );
  });
});

describe(createTemplateVariablesFragment, () => {
  let fragment: DocumentFragment;

  beforeEach(() => {
    fragment = createMockDocumentFragment();
  });

  it("should create fragment with intro text", () => {
    createTemplateVariablesFragment(fragment);

    const textContent = fragment.textContent;

    expect(textContent).toContain(
      "Template for note body. Available variables:",
    );
  });

  it("should create div container for variables", () => {
    createTemplateVariablesFragment(fragment);

    const divs = fragment.querySelectorAll("div");

    expect(divs.length).toBeGreaterThan(0);
  });

  it("should create code element for each variable", () => {
    createTemplateVariablesFragment(fragment);

    const codeElements = fragment.querySelectorAll("code");

    expect(codeElements).toHaveLength(TEMPLATE_VARIABLES.length);
  });

  it("should format variable names with double braces", () => {
    createTemplateVariablesFragment(fragment);

    const codeElements = fragment.querySelectorAll("code");

    for (const [index, code] of codeElements.entries()) {
      expect(code.textContent).toBe(`{{${TEMPLATE_VARIABLES[index].name}}}`);
    }
  });

  it("should include variable descriptions", () => {
    createTemplateVariablesFragment(fragment);

    const textContent = fragment.textContent;

    for (const variable of TEMPLATE_VARIABLES) {
      expect(textContent).toContain(variable.description);
    }
  });

  it("should apply styling to container", () => {
    createTemplateVariablesFragment(fragment);

    const container = fragment.querySelector("div");

    expect(container?.style.marginTop).toBe("0.5em");
  });

  it("should apply styling to variable rows", () => {
    createTemplateVariablesFragment(fragment);

    const rows = fragment.querySelectorAll("div > div");

    for (const row of rows) {
      const htmlRow = row as HTMLElement;

      expect(htmlRow.style.display).toBe("flex");
      expect(htmlRow.style.alignItems).toBe("baseline");
      expect(htmlRow.style.gap).toBe("0.5em");
    }
  });

  it("should apply styling to code elements", () => {
    createTemplateVariablesFragment(fragment);

    const codeElements = fragment.querySelectorAll("code");

    for (const code of codeElements) {
      const htmlCode = code;

      expect(htmlCode.style.display).toBe("inline-block");
      expect(htmlCode.style.minWidth).toBe("130px");
    }
  });
});
