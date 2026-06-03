import test from "node:test";
import assert from "node:assert/strict";
import { formatSettingPanelHtml } from "../src/ui/panels.js";

test("setting panel escapes current value and keeps description", () => {
  const html = formatSettingPanelHtml({
    titleText: "Sandbox",
    current: "workspace-write & more",
    description: "Choose how Codex can touch files."
  });
  assert.match(html, /<b>Sandbox<\/b>/);
  assert.match(html, /Current: <code>workspace-write &amp; more<\/code>/);
  assert.match(html, /Choose how Codex can touch files\./);
});
