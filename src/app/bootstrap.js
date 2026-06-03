import fs from "node:fs/promises";

export async function bootstrapBot({
  bot,
  config,
  ensureDirectory,
  registerTelegramCommands,
  startCleanupScheduler,
  startPersistedQueues,
  startStateSnapshotScheduler,
  processRef = process,
  logger = console
}) {
  await ensureDirectory(config.codexWorkdir, "CODEX_WORKDIR");
  await fs.mkdir(config.uploadDir, { recursive: true });
  await fs.mkdir(config.cleanupQuarantineDir, { recursive: true });
  await fs.mkdir(config.backupDir, { recursive: true });
  startCleanupScheduler();
  startStateSnapshotScheduler();
  registerTelegramCommands().catch((error) => {
    logger.warn("Telegram command menu registration failed:", error instanceof Error ? error.message : String(error));
  });
  await bot.launch();
  logger.log("codex-telegram-bot started");
  startPersistedQueues();

  processRef.once("SIGINT", () => bot.stop("SIGINT"));
  processRef.once("SIGTERM", () => bot.stop("SIGTERM"));
}
