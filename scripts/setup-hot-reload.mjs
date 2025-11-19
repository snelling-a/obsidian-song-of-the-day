import dotenv from "dotenv";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

dotenv.config();

const HOT_RELOAD_URL =
  "https://raw.githubusercontent.com/pjeby/hot-reload/master/main.js";
const HOT_RELOAD_MANIFEST_URL =
  "https://raw.githubusercontent.com/pjeby/hot-reload/master/manifest.json";

async function downloadFile(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }

  return await response.text();
}

async function setupHotReload() {
  const vaultPath = process.env.PATH_TO_DEV_VAULT;

  if (!vaultPath) {
    console.error("❌ PATH_TO_DEV_VAULT is not set in .env file");
    console.log("\nPlease create a .env file with:");
    console.log("PATH_TO_DEV_VAULT=/path/to/your/vault");
    process.exit(1);
  }

  if (!existsSync(vaultPath)) {
    console.error(`❌ Vault path does not exist: ${vaultPath}`);
    process.exit(1);
  }

  const hotReloadDir = join(vaultPath, ".obsidian", "plugins", "hot-reload");

  if (!existsSync(hotReloadDir)) {
    mkdirSync(hotReloadDir, { recursive: true });
    console.log(`✓ Created directory: ${hotReloadDir}`);
  } else {
    console.log(`✓ Directory already exists: ${hotReloadDir}`);
  }

  try {
    console.log("Downloading hot-reload main.js...");
    const mainJs = await downloadFile(HOT_RELOAD_URL);

    writeFileSync(join(hotReloadDir, "main.js"), mainJs);
    console.log("✓ Downloaded main.js");

    console.log("Downloading hot-reload manifest.json...");
    const manifest = await downloadFile(HOT_RELOAD_MANIFEST_URL);

    writeFileSync(join(hotReloadDir, "manifest.json"), manifest);
    console.log("✓ Downloaded manifest.json");

    console.log("\n✅ Hot-reload plugin installed successfully!");
    console.log("\nNext steps:");
    console.log("1. Restart Obsidian or reload plugins (Ctrl/Cmd + R)");
    console.log("2. Enable 'Hot-Reload' in Settings → Community plugins");
    console.log("3. Run 'npm run dev' to start developing with auto-reload");
  } catch (error) {
    console.error("❌ Failed to setup hot-reload:", error.message);
    process.exit(1);
  }
}

setupHotReload();
