import test from "node:test";
import assert from "node:assert/strict";
import { booleanOptionKeyboardRows } from "../src/ui/keyboards.js";

test("boolean option keyboard rows include default, on, off, and settings back row", () => {
  assert.deepEqual(booleanOptionKeyboardRows("network", "Settings"), [
    [
      { text: "default", callback_data: "set:network:default" },
      { text: "on", callback_data: "set:network:on" },
      { text: "off", callback_data: "set:network:off" }
    ],
    [{ text: "Settings", callback_data: "p:settings" }]
  ]);
});
