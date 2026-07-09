import "dotenv/config";

import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const codexPath = resolveCodexPath(process.env.CODEX_PATH, process.cwd());
const codexHome = resolvePath(process.env.CODEX_HOME, path.join(os.homedir(), ".codex"), process.cwd());
const configFile = resolvePath(process.env.CODEX_CONFIG_FILE, "", process.cwd());
const profile = process.env.CODEX_PROFILE?.trim() || "";
const profileFile = profile ? path.join(codexHome, `${profile}.config.toml`) : "";
const sdkFile = path.join(process.cwd(), "node_modules", "@openai", "codex-sdk", "dist", "index.js");

console.log("Codex Telegram configuration check");
console.log("");
console.log(`CODEX_PATH        = ${codexPath}`);
console.log(`CODEX_HOME        = ${codexHome}`);
console.log(`CODEX_CONFIG_FILE = ${configFile || "(not set)"}`);
console.log(`CODEX_PROFILE     = ${profile || "(not set)"}`);
console.log(`profile file      = ${profileFile || "(not used)"}`);
console.log("");

printFileStatus("config source", configFile);
printFileStatus("profile target", profileFile);

if (configFile && profileFile && fs.existsSync(configFile) && fs.existsSync(profileFile)) {
  const sourceHash = sha256(configFile);
  const profileHash = sha256(profileFile);
  console.log(`config hash       = ${sourceHash}`);
  console.log(`profile hash      = ${profileHash}`);
  console.log(`config synced     = ${sourceHash === profileHash ? "yes" : "NO"}`);
}

console.log("");
if (fs.existsSync(sdkFile)) {
  const sdkSource = fs.readFileSync(sdkFile, "utf8");
  const patched = sdkSource.includes("process.env.CODEX_PROFILE") && sdkSource.includes('"--profile", codexProfile');
  console.log(`SDK profile patch = ${patched ? "applied" : "NOT APPLIED"}`);
} else {
  console.log(`SDK profile patch = unknown; missing ${sdkFile}`);
}

const version = spawnSync(codexPath, ["--version"], { encoding: "utf8" });
console.log(`codex --version   = ${formatSpawnResult(version)}`);

if (profile) {
  const promptInput = spawnSync(codexPath, ["--profile", profile, "debug", "prompt-input", "ping"], {
    encoding: "utf8",
    timeout: 120_000
  });
  console.log(`profile usable    = ${promptInput.status === 0 ? "yes" : "NO"}`);
  if (promptInput.status !== 0 || promptInput.error) {
    console.log(`profile error     = ${formatSpawnResult(promptInput)}`);
  }
} else {
  console.log("profile usable    = skipped; CODEX_PROFILE is not set");
}

console.log("");
console.log("Expected Telegram worker command shape:");
console.log(profile ? `  codex --profile ${profile} exec ...` : "  codex exec ...");

function printFileStatus(label, filePath) {
  if (!filePath) {
    console.log(`${label.padEnd(17)}= (not set)`);
    return;
  }
  if (!fs.existsSync(filePath)) {
    console.log(`${label.padEnd(17)}= MISSING: ${filePath}`);
    return;
  }
  const stat = fs.statSync(filePath);
  console.log(`${label.padEnd(17)}= ${filePath} (${stat.size} bytes, ${stat.mtime.toISOString()})`);
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex").slice(0, 16);
}

function formatSpawnResult(result) {
  if (result.error) return `${result.error.code || "error"}: ${result.error.message}`;
  const output = `${result.stdout || result.stderr || ""}`.trim().split(/\r?\n/, 1)[0] || `exit ${result.status}`;
  return result.status === 0 ? output : `exit ${result.status}: ${output}`;
}

function resolvePath(value, fallback, baseDir) {
  const raw = expandPathEnv(value?.trim() || fallback);
  if (!raw) return "";
  if (path.isAbsolute(raw)) return raw;
  if (looksLikePath(raw)) return path.resolve(baseDir, raw);
  return raw;
}

function resolveCodexPath(value, baseDir) {
  const raw = expandPathEnv(value?.trim() || "auto");
  if (!raw || raw.toLowerCase() === "auto") return defaultLocalCodexPath(baseDir) || "codex";
  return resolvePath(raw, "codex", baseDir);
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

function defaultLocalCodexPath(appRoot) {
  const platformPackages = {
    "linux:x64": ["codex-linux-x64", "x86_64-unknown-linux-musl", "codex"],
    "linux:arm64": ["codex-linux-arm64", "aarch64-unknown-linux-musl", "codex"],
    "darwin:x64": ["codex-darwin-x64", "x86_64-apple-darwin", "codex"],
    "darwin:arm64": ["codex-darwin-arm64", "aarch64-apple-darwin", "codex"],
    "win32:x64": ["codex-win32-x64", "x86_64-pc-windows-msvc", "codex.exe"],
    "win32:arm64": ["codex-win32-arm64", "aarch64-pc-windows-msvc", "codex.exe"]
  };
  const platformPackage = platformPackages[`${process.platform}:${process.arch}`];
  if (!platformPackage) return "";
  const [packageName, targetTriple, binaryName] = platformPackage;
  const candidate = path.join(
    appRoot,
    "node_modules",
    "@openai",
    packageName,
    "vendor",
    targetTriple,
    "bin",
    binaryName
  );
  return fs.existsSync(candidate) ? candidate : "";
}
