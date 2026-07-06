import test from "node:test";
import assert from "node:assert/strict";
import { appServerThreadReadEvents, createAppServerThread } from "../src/codex/app_server.js";

test("createAppServerThread exposes an SDK-like thread shape", () => {
  const thread = createAppServerThread({
    threadId: "thread-1",
    threadOptions: { workingDirectory: "/repo" },
    autostart: false
  });
  assert.equal(thread.transport, "app-server");
  assert.equal(thread.id, "thread-1");
  assert.equal(typeof thread.run, "function");
  assert.equal(typeof thread.runStreamed, "function");
});

test("appServerThreadReadEvents converts completed turns into stream notifications", () => {
  const events = appServerThreadReadEvents({
    thread: {
      id: "thread-1",
      turns: [
        {
          id: "turn-1",
          status: "completed",
          items: [
            { type: "agentMessage", id: "msg-1", text: "done" }
          ]
        }
      ]
    }
  });

  assert.deepEqual(events, [
    {
      method: "item/completed",
      params: {
        threadId: "thread-1",
        turnId: "turn-1",
        item: { type: "agentMessage", id: "msg-1", text: "done" }
      }
    },
    {
      method: "turn/completed",
      params: {
        threadId: "thread-1",
        turn: {
          id: "turn-1",
          status: "completed",
          items: [
            { type: "agentMessage", id: "msg-1", text: "done" }
          ]
        }
      }
    }
  ]);
});
