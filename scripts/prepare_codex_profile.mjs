import "./env.mjs";

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const profile = process.env.CODEX_PROFILE?.trim();
const configFile = resolvePath(process.env.CODEX_CONFIG_FILE, "", process.cwd());

if (!profile || !configFile) {
  process.exit(0);
}

if (!/^[A-Za-z0-9_-]+$/.test(profile)) {
  console.error("CODEX_PROFILE must contain only letters, numbers, underscores, or hyphens.");
  process.exit(1);
}

const codexHome = resolvePath(process.env.CODEX_HOME, path.join(os.homedir(), ".codex"), process.cwd());
const targetFile = path.join(codexHome, `${profile}.config.toml`);

if (!fs.existsSync(configFile)) {
  console.error(`CODEX_CONFIG_FILE does not exist: ${configFile}`);
  process.exit(1);
}

fs.mkdirSync(codexHome, { recursive: true });

const source = fs.readFileSync(configFile);
const current = fs.existsSync(targetFile) ? fs.readFileSync(targetFile) : null;
if (!current || !source.equals(current)) {
  fs.copyFileSync(configFile, targetFile);
  console.log(`Synced Codex profile config: ${targetFile}`);
} else {
  console.log(`Codex profile config is up to date: ${targetFile}`);
}

function resolvePath(value, fallback, baseDir) {
  const raw = expandPathEnv(value?.trim() || fallback);
  if (!raw) return "";
  if (path.isAbsolute(raw)) return raw;
  if (looksLikePath(raw)) return path.resolve(baseDir, raw);
  return raw;
}

function expandPathEnv(value) {
  return String(value || "")
    .replace(/^~(?=$|[\\/])/, os.homedir())
    .replace(/%([^%]+)%/g, (match, name) => process.env[name] ?? match)
    .replace(/\$\{([^}]+)\}/g, (match, name) => process.env[name] ?? match);
}

function looksLikePath(value) {
  return value.startsWith(".") || value.includes("/") || value.includes("\\");
}
