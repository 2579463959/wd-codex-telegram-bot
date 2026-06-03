import test from "node:test";
import assert from "node:assert/strict";
import {
  dequeueNextTurn,
  enqueueTurn,
  hydratePendingQueues,
  moveTurn,
  planIncomingTurn,
  pruneExpiredTurns,
  removeTurn
} from "../src/queue.js";

function turn(id, offsetSeconds = 60) {
  const now = Date.parse("2026-06-03T00:00:00.000Z");
  return {
    id,
    chatKey: "chat-1",
    chatId: "chat-1",
    text: `text ${id}`,
    inputText: `input ${id}`,
    imagePaths: [],
    enqueuedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + offsetSeconds * 1000).toISOString()
  };
}

test("incoming queue mode chooses safe, interrupt, side, pause, or immediate action", () => {
  assert.equal(planIncomingTurn({ active: true, queueMode: "safe" }), "enqueue_back");
  assert.equal(planIncomingTurn({ active: true, queueMode: "interrupt" }), "enqueue_front_interrupt");
  assert.equal(planIncomingTurn({ active: true, queueMode: "side" }), "start_side");
  assert.equal(planIncomingTurn({ active: false, paused: true, pendingCount: 1, queueMode: "safe" }), "enqueue_back");
  assert.equal(planIncomingTurn({ active: false, paused: true, pendingCount: 0, queueMode: "safe" }), "start_now");
});

test("enqueueTurn appends safe turns and prepends interrupt turns with capacity checks", () => {
  const queue = [turn("a")];
  assert.deepEqual(enqueueTurn(queue, turn("b"), { max: 2 }).queue.map((item) => item.id), ["a", "b"]);
  assert.deepEqual(enqueueTurn(queue, turn("z"), { max: 2, front: true }).queue.map((item) => item.id), ["z", "a"]);
  assert.equal(enqueueTurn(queue, turn("c"), { max: 1 }).ok, false);
});

test("removeTurn supports 1-based number and id selectors", () => {
  assert.deepEqual(removeTurn([turn("a"), turn("b")], "2"), { changed: 1, queue: [turn("a")] });
  assert.deepEqual(removeTurn([turn("a"), turn("b")], "a").queue.map((item) => item.id), ["b"]);
  assert.equal(removeTurn([turn("a")], "missing").changed, 0);
});

test("moveTurn supports up and next actions", () => {
  assert.deepEqual(moveTurn([turn("a"), turn("b"), turn("c")], "c", "up").queue.map((item) => item.id), ["a", "c", "b"]);
  assert.deepEqual(moveTurn([turn("a"), turn("b"), turn("c")], "c", "next").queue.map((item) => item.id), ["c", "a", "b"]);
  assert.equal(moveTurn([turn("a")], "a", "up").changed, 0);
});

test("dequeueNextTurn skips expired pending turns", () => {
  const result = dequeueNextTurn([turn("expired", -1), turn("fresh", 60)], {
    now: new Date("2026-06-03T00:00:00.000Z"),
    maxAgeSeconds: 3600
  });
  assert.equal(result.turn.id, "fresh");
  assert.equal(result.expired, 1);
  assert.deepEqual(result.queue, []);
});

test("pruneExpiredTurns preserves recent turns", () => {
  const result = pruneExpiredTurns([turn("old", -1), turn("new", 60)], {
    now: new Date("2026-06-03T00:00:00.000Z"),
    maxAgeSeconds: 3600
  });
  assert.equal(result.expired, 1);
  assert.deepEqual(result.queue.map((item) => item.id), ["new"]);
});

test("hydratePendingQueues normalizes persisted queue state", () => {
  const hydrated = hydratePendingQueues({
    "chat-1": [
      { inputText: "saved", imagePaths: ["a.png", 123], enqueuedAt: "bad-date" },
      { inputText: "expired", expiresAt: "2026-06-02T00:00:00.000Z" }
    ],
    ignored: "not-array"
  }, {
    now: new Date("2026-06-03T00:00:00.000Z"),
    maxAgeSeconds: 3600,
    createId: () => "generated"
  });
  assert.deepEqual([...hydrated.pending.entries()].map(([chatKey, queue]) => [chatKey, queue.map((item) => item.id)]), [["chat-1", ["generated"]]]);
  assert.deepEqual(hydrated.queues["chat-1"][0].imagePaths, ["a.png"]);
});
