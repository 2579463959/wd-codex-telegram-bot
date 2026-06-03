import test from "node:test";
import assert from "node:assert/strict";
import { readConfig } from "../src/config.js";

const requiredEnv = {
  HOME: "/home/tester",
  TELEGRAM_BOT_TOKEN: "123456789:telegram-token",
  ALLOWED_USER_IDS: "42"
};

function readTestConfig(env = {}) {
  return readConfig(
    { ...requiredEnv, ...env },
    {
      appRoot: "/app",
      cwd: "/cwd"
    }
  );
}

test("readConfig applies stable defaults from env and options", () => {
  const config = readTestConfig();
  assert.equal(config.codexWorkdir, "/home/tester");
  assert.equal(config.codexHome, "/home/tester/.codex");
  assert.equal(config.codexSessionsDir, "/home/tester/.codex/sessions");
  assert.equal(config.stateFile, "/app/state/threads.json");
  assert.equal(config.telegramFormatCodexAnswers, "markdown");
  assert.equal(config.telegramPendingTurnsMax, 10);
  assert.equal(config.telegramPendingTurnMaxAgeSeconds, 7200);
  assert.equal(config.codexSkipGitRepoCheck, false);
  assert.equal(config.uploadRetentionDays, 7);
  assert.equal(config.uploadMaxBytes, 1_073_741_824);
  assert.equal(config.uploadCleanupEnabled, true);
  assert.deepEqual([...config.allowedUserIds], ["42"]);
});

test("readConfig parses optional allowed chat and thread ids", () => {
  const config = readTestConfig({
    ALLOWED_CHAT_IDS: "100, -200",
    ALLOWED_THREAD_IDS: "300"
  });
  assert.deepEqual([...config.allowedChatIds], ["100", "-200"]);
  assert.deepEqual([...config.allowedThreadIds], ["300"]);
});

test("readConfig rejects non-numeric Telegram allowlist ids", () => {
  assert.throws(
    () => readTestConfig({ ALLOWED_USER_IDS: "42, abc" }),
    /ALLOWED_USER_IDS must contain numeric Telegram ids/
  );
  assert.throws(
    () => readTestConfig({ ALLOWED_CHAT_IDS: "100, chat" }),
    /ALLOWED_CHAT_IDS must contain numeric Telegram ids/
  );
  assert.throws(
    () => readTestConfig({ ALLOWED_THREAD_IDS: "-10" }),
    /ALLOWED_THREAD_IDS must contain numeric Telegram ids/
  );
});

test("readConfig validates cleanup notify chat ids like Telegram chat ids", () => {
  const config = readTestConfig({ CLEANUP_NOTIFY_CHAT_IDS: "-1001234567890, 42" });
  assert.deepEqual(config.cleanupNotifyChatIds, ["-1001234567890", "42"]);
  assert.throws(
    () => readTestConfig({ CLEANUP_NOTIFY_CHAT_IDS: "not-chat" }),
    /CLEANUP_NOTIFY_CHAT_IDS must contain numeric Telegram ids/
  );
});

test("readConfig rejects invalid integer env values", () => {
  assert.throws(
    () => readTestConfig({ MAX_TELEGRAM_CHARS: "not-a-number" }),
    /MAX_TELEGRAM_CHARS must be a non-negative integer/
  );
});

test("readConfig rejects negative integer env values", () => {
  assert.throws(
    () => readTestConfig({ CLEANUP_RETENTION_DAYS: "-1" }),
    /CLEANUP_RETENTION_DAYS must be a non-negative integer/
  );
});

test("readConfig rejects invalid enum env values", () => {
  assert.throws(
    () => readTestConfig({ TELEGRAM_FORMAT_CODEX_ANSWERS: "rich" }),
    /TELEGRAM_FORMAT_CODEX_ANSWERS must be off, safe, or markdown/
  );
});
