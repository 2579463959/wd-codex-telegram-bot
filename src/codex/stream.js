export function createCodexStreamState() {
  return {
    items: new Map(),
    finalResponse: "",
    usage: null
  };
}

export function applyCodexStreamEvent(state, event) {
  if (event.type === "thread.started") {
    return { type: "thread_started", threadId: event.thread_id };
  }
  if (event.type === "turn.started") {
    return { type: "turn_started" };
  }
  if (event.type === "item.started" || event.type === "item.updated" || event.type === "item.completed") {
    state.items.set(event.item.id, event.item);
    if (event.item.type === "agent_message") state.finalResponse = event.item.text;
    return { type: "item" };
  }
  if (event.type === "turn.completed") {
    state.usage = event.usage;
    return { type: "turn_completed" };
  }
  if (event.type === "turn.failed") {
    return { type: "error", message: event.error.message };
  }
  if (event.type === "error") {
    return { type: "error", message: event.message };
  }
  return { type: "unknown" };
}

export function codexStreamItems(state) {
  return [...state.items.values()];
}

export function codexStreamResult(state) {
  return {
    items: codexStreamItems(state),
    finalResponse: state.finalResponse,
    usage: state.usage
  };
}
