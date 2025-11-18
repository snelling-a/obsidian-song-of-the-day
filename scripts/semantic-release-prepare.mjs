import { execSync } from "child_process";

export async function prepare() {
  console.log("📦 Building plugin after version bump...");
  execSync("node scripts/esbuild.config.mjs production", { stdio: "inherit" });
}
