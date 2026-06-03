import fs from "node:fs/promises";
import path from "node:path";

export function buildCleanupArtifactPaths({ cleanupArtifactDir, dateKey, planId, action }) {
  const safePlanId = String(planId || "plan").replace(/[^a-zA-Z0-9_-]/g, "_");
  const dir = path.join(cleanupArtifactDir, `${dateKey}-${safePlanId}-${action}`);
  return {
    dir,
    deleteBackupDir: path.join(dir, "delete-backup"),
    manifest: path.join(dir, "manifest.jsonl"),
    restoreScript: path.join(dir, "restore-cleanup.py")
  };
}

export async function createCleanupArtifact({ plan, action, cleanupArtifactDir, dateKey }) {
  const artifact = buildCleanupArtifactPaths({
    cleanupArtifactDir,
    dateKey,
    planId: plan.id,
    action
  });
  await fs.mkdir(artifact.dir, { recursive: true });
  await fs.mkdir(artifact.deleteBackupDir, { recursive: true });
  await fs.writeFile(path.join(artifact.dir, "plan.json"), `${JSON.stringify(plan, null, 2)}\n`, "utf8");
  await fs.writeFile(artifact.restoreScript, cleanupRestoreScript(artifact.manifest), "utf8");
  return artifact;
}

export async function finalizeCleanupArtifact(artifact, operations, result) {
  const lines = operations.map((operation) => JSON.stringify(operation));
  await fs.writeFile(artifact.manifest, `${lines.join("\n")}${lines.length ? "\n" : ""}`, "utf8");
  await fs.writeFile(path.join(artifact.dir, "result.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
}

export function cleanupRestoreScript(manifestPath) {
  return `#!/usr/bin/env python3
import json
import shutil
from pathlib import Path

manifest = Path(${JSON.stringify(manifestPath)})
for line in manifest.read_text(encoding="utf-8").splitlines():
    rec = json.loads(line)
    if rec.get("type") == "quarantine":
        src = Path(rec["to"])
        dest = Path(rec["from"])
        if src.exists():
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(src), str(dest))
    elif rec.get("type") == "delete":
        src = Path(rec["backup"])
        dest = Path(rec["from"])
        if src.exists():
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dest)
        meta = Path(str(src) + ".cleanup.json")
        if meta.exists():
            shutil.copy2(meta, Path(str(dest) + ".cleanup.json"))
`;
}
