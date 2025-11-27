import { describe, expect, expectTypeOf, it } from "vitest";

import { FIELD_REGISTRY } from "./field-registry";
import { TEMPLATE_VARIABLES } from "./template-variables";

describe("template-variables", () => {
  it("should have same length as FIELD_REGISTRY", () => {
    expect(TEMPLATE_VARIABLES).toHaveLength(FIELD_REGISTRY.length);
  });

  it("should have 10 template variables", () => {
    expect(TEMPLATE_VARIABLES).toHaveLength(10);
  });

  it("should have all required properties on each variable", () => {
    for (const variable of TEMPLATE_VARIABLES) {
      expect(variable).toHaveProperty("name");
      expect(variable).toHaveProperty("description");
      expect(variable).toHaveProperty("getValue");

      expectTypeOf(variable.name).toBeString();
      expectTypeOf(variable.description).toBeString();
      expectTypeOf(variable.getValue).toBeFunction();
    }
  });

  it("should have unique variable names", () => {
    const names = TEMPLATE_VARIABLES.map((variable) => variable.name);
    const uniqueNames = new Set(names);

    expect(uniqueNames.size).toBe(names.length);
  });

  it("should map field keys to variable names", () => {
    for (const [index, field] of FIELD_REGISTRY.entries()) {
      const variable = TEMPLATE_VARIABLES[index];

      expect(variable.name).toBe(field.key);
    }
  });

  it("should map field descriptions to variable descriptions", () => {
    for (const [index, field] of FIELD_REGISTRY.entries()) {
      const variable = TEMPLATE_VARIABLES[index];

      expect(variable.description).toBe(field.description);
    }
  });

  it("should map field getValue functions to variable getValue functions", () => {
    for (const [index, field] of FIELD_REGISTRY.entries()) {
      const variable = TEMPLATE_VARIABLES[index];

      expect(variable.getValue).toBe(field.getValue);
    }
  });

  it("should include title variable", () => {
    const titleVariable = TEMPLATE_VARIABLES.find(
      (variable) => variable.name === "title",
    );

    expect(titleVariable).toBeDefined();
    expect(titleVariable?.description).toBe("Track title");
  });

  it("should include artist variable", () => {
    const artistVariable = TEMPLATE_VARIABLES.find(
      (variable) => variable.name === "artist",
    );

    expect(artistVariable).toBeDefined();
    expect(artistVariable?.description).toBe("Artist name(s), comma-separated");
  });

  it("should include album variable", () => {
    const albumVariable = TEMPLATE_VARIABLES.find(
      (variable) => variable.name === "album",
    );

    expect(albumVariable).toBeDefined();
    expect(albumVariable?.description).toBe("Album name");
  });

  it("should include all expected variables", () => {
    const expectedVariables = [
      "title",
      "artist",
      "album",
      "release_date",
      "date",
      "cover",
      "spotify_url",
      "spotify_id",
      "duration_ms",
      "duration",
    ];

    for (const expected of expectedVariables) {
      const found = TEMPLATE_VARIABLES.find(
        (variable) => variable.name === expected,
      );

      expect(found).toBeDefined();
    }
  });
});
