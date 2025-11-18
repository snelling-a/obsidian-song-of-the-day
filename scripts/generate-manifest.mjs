import pkg from "../package.json" with { type: "json" };

const { author, description, funding, name: packageName, version } = pkg;

const MIN_APP_VERSION = "10.0.0";
const IS_DESKTOP_ONLY = false;

/**
 * Converts package name to plugin app ID and display name.
 * Strips 'obsidian-' prefix and transforms kebab-case to Title Case.
 *
 * @returns Object containing the plugin pluginId and displayName
 */
function toDisplayName() {
  const pluginId = packageName.replace(/^obsidian-/, "");
  const displayName = pluginId
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return { displayName, pluginId };
}

const { displayName, pluginId } = toDisplayName();

export const manifest = {
  author: author.name,
  authorUrl: author?.url,
  description,
  fundingUrl: funding?.url,
  id: pluginId,
  isDesktopOnly: IS_DESKTOP_ONLY,
  minAppVersion: MIN_APP_VERSION,
  name: displayName,
  version,
};

/**
 * Generates the manifest.json content as a formatted JSON string.
 * Uses tab indentation for Obsidian plugin manifest format.
 *
 * @returns Formatted JSON string of the manifest object
 */
export function generateManifest() {
  return JSON.stringify(manifest, null, "\t");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  import("fs").then(({ writeFileSync }) => {
    writeFileSync("manifest.json", generateManifest() + "\n");
    console.log("✓ Generated manifest.json");
  });
}
