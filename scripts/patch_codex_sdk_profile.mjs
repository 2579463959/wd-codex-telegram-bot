import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const sdkPath = path.join(
  process.cwd(),
  "node_modules",
  "@openai",
  "codex-sdk",
  "dist",
  "index.js"
);

const original = 'const commandArgs = ["exec", "--experimental-json"];';
const patched = [
  "const codexProfile = process.env.CODEX_PROFILE?.trim();",
  'const commandArgs = codexProfile ? ["--profile", codexProfile, "exec", "--experimental-json"] : ["exec", "--experimental-json"];'
].join("\n    ");

if (!fs.existsSync(sdkPath)) {
  console.error(`Codex SDK file not found: ${sdkPath}`);
  process.exit(1);
}

const source = fs.readFileSync(sdkPath, "utf8");
if (source.includes(patched)) {
  console.log("Codex SDK profile patch already applied.");
  process.exit(0);
}

if (!source.includes(original)) {
  console.error("Codex SDK profile patch failed: expected commandArgs marker not found.");
  process.exit(1);
}

fs.writeFileSync(sdkPath, source.replace(original, patched));
console.log("Codex SDK profile patch applied.");
