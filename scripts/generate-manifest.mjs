import pkg from "../package.json" with { type: "json" };

const { author, description, funding, name: packageName, version } = pkg;

const MIN_APP_VERSION = "10.0.0";
const IS_DESKTOP_ONLY = false;

/**
 * Converts kebab-case package name to Title Case display name
 * @param {string} name - Package name (e.g., "obsidian-song-of-the-day")
 * @returns Display name (e.g., "Song of the Day")
 */
function toDisplayName(name) {
  return name
    .replace(/^obsidian-/, "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const manifest = {
  author: author.name,
  authorUrl: author?.url,
  description,
  fundingUrl: funding?.url,
  id: packageName,
  isDesktopOnly: IS_DESKTOP_ONLY,
  minAppVersion: MIN_APP_VERSION,
  name: toDisplayName(packageName),
  version,
};

export function generateManifest() {
  return JSON.stringify(manifest, null, "\t");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  import("fs").then(({ writeFileSync }) => {
    writeFileSync("manifest.json", generateManifest() + "\n");
    console.log("✓ Generated manifest.json");
  });
}
