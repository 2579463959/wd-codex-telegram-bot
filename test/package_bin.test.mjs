import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function readJson(path) {
  return JSON.parse(await fs.readFile(new URL(`../${path}`, import.meta.url), "utf8"));
}

test("package exposes codex-telegram-bot bin and preserves yolo helper", async () => {
  const pkg = await readJson("package.json");
  assert.equal(pkg.bin?.["codex-telegram-bot"], "./bin/codex-telegram-bot");
  assert.equal(pkg.bin?.["codex-yolo"], undefined);

  const botBin = await fs.stat(new URL("../bin/codex-telegram-bot", import.meta.url));
  const yoloBin = await fs.stat(new URL("../bin/codex-yolo", import.meta.url));
  assert.notEqual(botBin.mode & 0o111, 0);
  assert.notEqual(yoloBin.mode & 0o111, 0);
});

test("codex-yolo prefers the package-local Codex CLI", async () => {
  const script = await fs.readFile(new URL("../bin/codex-yolo", import.meta.url), "utf8");
  assert.equal(script.includes("node_modules/.bin/codex"), true);
  const { stdout } = await execFileAsync(new URL("../bin/codex-yolo", import.meta.url).pathname, ["--version"], {
    timeout: 5000
  });
  const localCli = await execFileAsync(new URL("../node_modules/.bin/codex", import.meta.url).pathname, ["--version"], {
    timeout: 5000
  });
  assert.equal(stdout.trim(), localCli.stdout.trim());
});

test("package files keep public assets, docs, and runtime source", async () => {
  const pkg = await readJson("package.json");
  for (const entry of ["assets", "bin", "docs", "scripts", "src", "systemd", "LICENSE", "SECURITY.md", "CONTRIBUTING.md"]) {
    assert.ok(pkg.files.includes(entry), `${entry} missing from package files`);
  }
});
