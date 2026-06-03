import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  buildCleanupArtifactPaths,
  cleanupRestoreScript,
  createCleanupArtifact,
  finalizeCleanupArtifact
} from "../src/maintenance/cleanup.js";

test("cleanup artifact paths sanitize plan id", () => {
  const artifact = buildCleanupArtifactPaths({
    cleanupArtifactDir: "/artifacts",
    dateKey: "20260603",
    planId: "../bad plan",
    action: "both"
  });
  assert.equal(artifact.dir, "/artifacts/20260603-___bad_plan-both");
  assert.equal(artifact.manifest, "/artifacts/20260603-___bad_plan-both/manifest.jsonl");
});

test("cleanup artifact writes plan, manifest, result, and restore script", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "codex-telegram-cleanup-"));
  const plan = { id: "plan-1", quarantineCandidates: [], deleteCandidates: [] };
  const artifact = await createCleanupArtifact({
    plan,
    action: "delete",
    cleanupArtifactDir: root,
    dateKey: "20260603"
  });

  await finalizeCleanupArtifact(artifact, [{ type: "delete", from: "/old", backup: "/backup" }], { deleted: 1 });

  assert.equal(JSON.parse(await fs.readFile(path.join(artifact.dir, "plan.json"), "utf8")).id, "plan-1");
  assert.match(await fs.readFile(artifact.restoreScript, "utf8"), /manifest = Path/);
  assert.match(await fs.readFile(artifact.manifest, "utf8"), /"type":"delete"/);
  assert.equal(JSON.parse(await fs.readFile(path.join(artifact.dir, "result.json"), "utf8")).deleted, 1);
});

test("cleanup restore script points at manifest path", () => {
  assert.match(cleanupRestoreScript("/tmp/manifest.jsonl"), /Path\("\/tmp\/manifest\.jsonl"\)/);
});
