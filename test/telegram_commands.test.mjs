import test from "node:test";
import assert from "node:assert/strict";
import { isRegisteredTelegramCommandText } from "../src/telegram_commands.js";

test("registered commands are recognized", () => {
  assert.equal(isRegisteredTelegramCommandText({ text: "/start", entities: [{ type: "bot_command", offset: 0, length: 6 }] }), true);
  assert.equal(isRegisteredTelegramCommandText({ text: "/queue_mode_safe", entities: [{ type: "bot_command", offset: 0, length: 16 }] }), true);
  assert.equal(isRegisteredTelegramCommandText({ text: "/start@my_bot", entities: [{ type: "bot_command", offset: 0, length: 13 }] }), true);
});

test("slash-prefixed paths and unknown commands are treated as normal text", () => {
  assert.equal(isRegisteredTelegramCommandText({ text: "/home/openclaw/.openclaw/ahahhss 이 폴더를 봐줘", entities: [{ type: "bot_command", offset: 0, length: 36 }] }), false);
  assert.equal(isRegisteredTelegramCommandText({ text: "/tmp/project check this" }), false);
  assert.equal(isRegisteredTelegramCommandText({ text: "/unknown_command please handle this", entities: [{ type: "bot_command", offset: 0, length: 16 }] }), false);
});

test("ordinary text is not a command", () => {
  assert.equal(isRegisteredTelegramCommandText({ text: "please inspect /home/openclaw" }), false);
  assert.equal(isRegisteredTelegramCommandText({ text: "" }), false);
});
