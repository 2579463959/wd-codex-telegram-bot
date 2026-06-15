import fs from "node:fs/promises";
import { recoveryPaths } from "./state.js";

export async function appendRecoveryJournal(recoveryDir, event) {
  await fs.mkdir(recoveryDir, { recursive: true });
  const payload = {
    ...event,
    at: event.at || new Date().toISOString()
  };
  await fs.appendFile(recoveryPaths(recoveryDir).journal, `${JSON.stringify(payload)}\n`, "utf8");
}

export function summarizeStreamEvent(event) {
  const item = event?.item;
  if (!item) return {
    type: event?.type || "unknown"
  };
  return {
    type: event.type,
    itemId: item.id || "",
    itemType: item.type || "",
    status: item.status || "",
    preview: previewText(item.text || item.command || item.name || item.path || "")
  };
}

function previewText(text, limit = 240) {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
}
