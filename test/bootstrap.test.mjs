import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { bootstrapBot } from "../src/app/bootstrap.js";

test("bootstrapBot prepares directories, starts schedulers, launches bot, and registers signals", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "codex-bot-bootstrap-"));
  const events = [];
  const signals = [];
  const bot = {
    async launch() {
      events.push("launch");
    },
    stop(signal) {
      events.push(`stop:${signal}`);
    }
  };
  const processRef = {
    once(signal, handler) {
      signals.push(signal);
      if (signal === "SIGTERM") handler();
    }
  };

  await bootstrapBot({
    bot,
    config: {
      codexWorkdir: path.join(root, "work"),
      uploadDir: path.join(root, "uploads"),
      cleanupQuarantineDir: path.join(root, "quarantine"),
      backupDir: path.join(root, "backups")
    },
    ensureDirectory: async (dir, label) => {
      events.push(`ensure:${label}`);
      await fs.mkdir(dir, { recursive: true });
    },
    registerTelegramCommands: async () => events.push("commands"),
    startCleanupScheduler: () => events.push("cleanup"),
    startStateSnapshotScheduler: () => events.push("snapshot"),
    startPersistedQueues: () => events.push("queues"),
    processRef,
    logger: { log: (message) => events.push(message), warn: (message) => events.push(message) }
  });

  assert.deepEqual(events, [
    "ensure:CODEX_WORKDIR",
    "cleanup",
    "snapshot",
    "commands",
    "launch",
    "codex-telegram-bot started",
    "queues",
    "stop:SIGTERM"
  ]);
  assert.deepEqual(signals, ["SIGINT", "SIGTERM"]);
  for (const dir of ["work", "uploads", "quarantine", "backups"]) {
    assert.equal((await fs.stat(path.join(root, dir))).isDirectory(), true);
  }
});
