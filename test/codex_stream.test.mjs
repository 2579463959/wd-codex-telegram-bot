import test from "node:test";
import assert from "node:assert/strict";
import {
  applyCodexStreamEvent,
  codexStreamItems,
  codexStreamResult,
  createCodexStreamState
} from "../src/codex/stream.js";

test("codex stream reducer records thread start", () => {
  const state = createCodexStreamState();
  assert.deepEqual(applyCodexStreamEvent(state, { type: "thread.started", thread_id: "thread-1" }), {
    type: "thread_started",
    threadId: "thread-1"
  });
});

test("codex stream reducer tracks items and final agent response", () => {
  const state = createCodexStreamState();
  applyCodexStreamEvent(state, {
    type: "item.started",
    item: { id: "item-1", type: "reasoning", text: "thinking" }
  });
  applyCodexStreamEvent(state, {
    type: "item.completed",
    item: { id: "item-2", type: "agent_message", text: "done" }
  });
  assert.deepEqual(codexStreamItems(state).map((item) => item.id), ["item-1", "item-2"]);
  assert.equal(codexStreamResult(state).finalResponse, "done");
});

test("codex stream reducer records usage and surfaces failures", () => {
  const state = createCodexStreamState();
  assert.deepEqual(applyCodexStreamEvent(state, { type: "turn.completed", usage: { input_tokens: 1 } }), {
    type: "turn_completed"
  });
  assert.deepEqual(codexStreamResult(state).usage, { input_tokens: 1 });
  assert.deepEqual(applyCodexStreamEvent(state, { type: "turn.failed", error: { message: "bad turn" } }), {
    type: "error",
    message: "bad turn"
  });
});
